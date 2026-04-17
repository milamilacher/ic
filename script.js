document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias al DOM ---
    const btnCalculate = document.getElementById('btn-calculate');
    const btnDownloadTrigger = document.getElementById('btn-download');
    const btnShare = document.getElementById('btn-share');
    const exportContainer = document.getElementById('export-container');
    const downloadModal = document.getElementById('download-modal');
    
    const btnConfirmImage = document.getElementById('confirm-image');
    const btnConfirmExcel = document.getElementById('confirm-excel');
    const btnCloseModal = document.getElementById('close-modal');

    const btnViewAnnual = document.getElementById('view-annual');
    const btnViewMonthly = document.getElementById('view-monthly');

    // Variables de Estado
    let historyData = []; 
    let currentView = 'annual'; // Rastrea si estamos en modo Anual o Mensual

    // --- Eventos Principales ---

    btnCalculate.addEventListener('click', () => {
        calculate();
        document.getElementById('results-section').classList.remove('hidden');
        document.getElementById('evolution-section').classList.remove('hidden');
        document.getElementById('extra-actions').classList.remove('hidden');
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });

    btnDownloadTrigger.addEventListener('click', () => {
        downloadModal.classList.remove('hidden');
    });

    btnCloseModal.onclick = () => downloadModal.classList.add('hidden');

    btnConfirmImage.onclick = async () => {
        downloadModal.classList.add('hidden');
        await exportAsImage();
    };

    btnConfirmExcel.onclick = async () => {
        downloadModal.classList.add('hidden');
        await exportAsExcel();
    };

    btnViewAnnual.onclick = () => { 
        currentView = 'annual';
        renderTable('annual'); 
        btnViewAnnual.classList.add('active'); 
        btnViewMonthly.classList.remove('active'); 
    };

    btnViewMonthly.onclick = () => { 
        currentView = 'monthly';
        renderTable('monthly'); 
        btnViewMonthly.classList.add('active'); 
        btnViewAnnual.classList.remove('active'); 
    };

    // --- Lógica de Cálculo ---

 function calculate() {
    const P = parseFloat(document.getElementById('initial-capital').value) || 0;
    const PM = parseFloat(document.getElementById('monthly-contribution').value) || 0;
    const periodValue = parseInt(document.getElementById('period-value').value) || 0;
    const periodUnit = document.querySelector('input[name="period-unit"]:checked').value;
    const rateValue = (parseFloat(document.getElementById('interest-rate').value) || 0) / 100;
    const rateRenewalCost = (parseFloat(document.getElementById('renewal-cost-rate').value) || 0) / 100; // Dividido 100 por ser %
    const rateUnit = document.querySelector('input[name="rate-unit"]:checked').value;
    
    // Frecuencia de capitalización (Asegúrate de tener este ID en tu HTML)
    const frequency = parseInt(document.getElementById('compounding-frequency').value) || 12;

    const totalMonths = (periodUnit === 'years') ? periodValue * 12 : periodValue;
    const rMonthly = (rateUnit === 'annual') ? Math.pow(1 + rateValue, 1/12) - 1 : rateValue;

    let currentBalance = P;
    let totalInvested = P;
    let accumulatedInterest = 0; // Interés generado pero no sumado al capital aún
    let totalCost = 0;
    historyData = [];

    // Meses necesarios para capitalizar según la frecuencia
    const monthsToCapitalize = 12 / frequency;

    for (let m = 1; m <= totalMonths; m++) {
        // 1. COSTO DE RENOVACIÓN (Se aplica sobre el saldo que viene del mes anterior)
        let monthlyRenewal = currentBalance * rateRenewalCost;
        currentBalance -= monthlyRenewal;
        totalCost += monthlyRenewal;

        // 2. APORTE MENSUAL (Desde el mes 2)
        // Se suma DESPUÉS del costo de renovación para no "pagar comisión" por el dinero que recién entra
        if (m >= 2) {
            currentBalance += PM;
            totalInvested += PM;
        }

        // 3. GENERACIÓN DE INTERÉS
        let interestThisMonth = currentBalance * rMonthly;
        accumulatedInterest += interestThisMonth;

        // 4. CAPITALIZACIÓN (¿Toca sumar el interés al capital para que genere más interés?)
        if (m % monthsToCapitalize === 0) {
            currentBalance += accumulatedInterest;
            accumulatedInterest = 0;
        }

        // 5. REGISTRO HISTÓRICO
        // Mostramos el total sumando el acumulado para que el usuario vea el valor real de su cuenta
        let snapshotTotal = currentBalance + accumulatedInterest;
        
        historyData.push({ 
            month: m, 
            total: snapshotTotal, 
            invested: totalInvested, 
            cost: totalCost, 
            gain: snapshotTotal - totalInvested 
        });
    }

    renderResults(currentBalance + accumulatedInterest, totalInvested, totalCost);
    renderTable(currentView);
}

    function renderResults(final, invested, cost) {
        document.getElementById('res-total-gain').innerText = formatCurrency(final - invested);
        document.getElementById('res-final-capital').innerText = formatCurrency(final);
        document.getElementById('res-total-cost').innerText = formatCurrency(cost);				
        document.getElementById('res-total-investment').innerText = formatCurrency(invested);
    }

    function renderTable(view) {
        const tbody = document.getElementById('table-body');
        const colTime = document.getElementById('col-time');
        tbody.innerHTML = '';
        colTime.innerText = (view === 'annual') ? 'Año' : 'Mes';

        const dataToShow = (view === 'annual') 
            ? historyData.filter(d => d.month % 12 === 0 || d.month === historyData.length) 
            : historyData;

        dataToShow.forEach(d => {
            const label = (view === 'annual') ? Math.ceil(d.month / 12) : d.month;
            const row = `<tr>
                <td>${label}</td>
                <td>${formatCurrency(d.total - d.gain)}</td>
                <td style="color:#00e676">+${formatCurrency(d.gain)}</td>
                <td style="color:#EDF32B; font-weight:bold">${formatCurrency(d.cost)}</td>								
                <td style="color:#ff8f00; font-weight:bold">${formatCurrency(d.total)}</td>
            </tr>`;
            tbody.innerHTML += row;
        });
    }

    function formatCurrency(v) {
        return new Intl.NumberFormat('es-AR', { 
            style: 'currency', currency: 'ARS', maximumFractionDigits: 0 
        }).format(v);
    }

    // --- Exportación Excel ---

async function exportAsExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Proyección');

    // 1. Obtener valores y resultados
    const capIni = document.getElementById('initial-capital').value;
    const aporteMensual = document.getElementById('monthly-contribution').value;
    const tiempo = document.getElementById('period-value').value;
    const tiempoUni = document.querySelector('input[name="period-unit"]:checked').value === 'years' ? 'Años' : 'Meses';
    const tasa = document.getElementById('interest-rate').value;
    const renewal_cost_rate = document.getElementById('renewal-cost-rate').value;	
    const tasaUni = document.querySelector('input[name="rate-unit"]:checked').value === 'annual' ? 'Anual' : 'Mensual';

    
    const finalCap = document.getElementById('res-final-capital').innerText;
    const totalGain = document.getElementById('res-total-gain').innerText;
    const totalCost = document.getElementById('res-total-cost').innerText;	
    const totalInv = document.getElementById('res-total-investment').innerText;

    // --- ESTILOS DE TÍTULO ---
    const titleCell = worksheet.getCell('A1');
    titleCell.value = "REPORTE DE PROYECCIÓN FINANCIERA";
    titleCell.font = { name: 'Arial', size: 16, bold: true };
    worksheet.mergeCells('A1:D1');

    worksheet.getCell('A2').value = "Generado el: " + new Date().toLocaleString();
    worksheet.getCell('A2').font = { italic: true };

    // --- BLOQUE DE VALORES INGRESADOS ---
    worksheet.addRow([]); // Espacio
    const sectionInputs = worksheet.addRow(["VALORES INGRESADOS"]);
    sectionInputs.font = { bold: true, underline: true };

    const rowsInputs = [
        ["Capital Inicial:", parseFloat(capIni)],
        ["Aportación Mensual:", parseFloat(aporteMensual)],
        ["Tiempo de Inversión:", `${tiempo} ${tiempoUni}`],
        ["Tasa de Interés:", `${tasa}% (${tasaUni})`],
        ["Tasa de Renovación:", `${renewal_cost_rate}%`]		
    ];
    
    rowsInputs.forEach(data => {
        const row = worksheet.addRow(data);
        row.getCell(1).font = { bold: true }; // Etiqueta en negrita
    });

    // --- BLOQUE DE RESULTADOS GENERALES ---
    worksheet.addRow([]);
    const sectionResults = worksheet.addRow(["RESULTADOS GENERALES"]);
    sectionResults.font = { bold: true, underline: true };

    const rowsRes = [
        ["INVERSIÓN TOTAL:", totalInv],
        ["GANANCIA TOTAL:", totalGain],
        ["COSTO TOTAL:", totalCost],		
        ["CAPITAL FINAL:", finalCap]
    ];

    rowsRes.forEach(data => {
        const row = worksheet.addRow(data);
        row.getCell(1).font = { bold: true };
    });

    worksheet.addRow([]);

    // --- TABLA DE PROYECCIÓN (Modo Tabla con colores) ---
    const tableHeader = [currentView === 'annual' ? "Año" : "Mes", "Capital Base", "Ganancia Acum.", "Costo Acum.", "Total"];
    const headerRow = worksheet.addRow(tableHeader);
    
    // Estilo encabezado tabla
    headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '212529' } };
        cell.alignment = { horizontal: 'center' };
    });

    // Datos de la tabla
    const dataToExport = (currentView === 'annual') 
        ? historyData.filter(d => d.month % 12 === 0 || d.month === historyData.length) 
        : historyData;

    dataToExport.forEach((d, index) => {
        const label = (currentView === 'annual') ? Math.ceil(d.month / 12) : d.month;
        const row = worksheet.addRow([
            label,
            parseFloat((d.total - d.gain).toFixed(2)),
            parseFloat(d.gain.toFixed(2)),
            parseFloat(d.cost.toFixed(2)),						
            parseFloat(d.total.toFixed(2))
        ]);

        // Filas intercaladas (Zebra stripes)
        if (index % 2 !== 0) {
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
            });
        }
    });

    // Ajustar anchos de columna
    worksheet.columns.forEach(column => {
        column.width = 22;
    });

    // Descargar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Proyeccion_Financiera_${currentView}.xlsx`);
}

    // --- Exportación Imagen ---

    async function exportAsImage() {
        const canvas = await html2canvas(exportContainer, {
            backgroundColor: '#0f1113', scale: 2, useCORS: true
        });
        const link = document.createElement('a');
        link.download = 'Reporte-Inversion.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    btnShare.addEventListener('click', async () => {
        const canvas = await html2canvas(exportContainer, { backgroundColor: '#0f1113', scale: 2 });
        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'MiProyeccion.png', { type: 'image/png' });
            if (navigator.share) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Mi Proyección Financiera',
                        text: 'He generado este plan de inversión. ¿Qué te parece?'
                    });
                } catch (err) { console.log(err); }
            } else {
                alert("Navegador no compatible. ¡Usa el botón de descarga!");
            }
        });
    });
});