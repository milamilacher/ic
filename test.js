//Rhino 1.7.14-2.1

// 1. CONFIGURACIÓN
let capitalInicial = 100000;
let aporteMensual = 100000;
let tasaAnual = 22;
let años = 20;


// 2. PREPARACIÓN
let meses = años * 12;
let rMensual = Math.pow(1 + (tasaAnual / 100), 1 / 12) - 1;
let saldo = capitalInicial;
let inversionBruta = capitalInicial; 
let costosTotales = 0;
let rRenovacion = 0.1;
let costoRenovacion = 0;

print(`--- PROYECCIÓN CON COSTO DESDE MES 1 ($${costoRenovacion}) ---`);

let proyeccion = [];

for (let i = 1; i <= meses; i++) {
    // Sumamos aporte mensual solo desde el mes 2 en adelante
    if (i >= 2) {
        saldo += aporteMensual;
        inversionBruta += aporteMensual;
    }

    //obtiene el costo de consitutución y/o renovación
    costoRenovacion = saldo / 100 * rRenovacion;    
	
    // B. Aplicación de Costos y Aportes
    // Descontamos renovación SIEMPRE (desde el mes 1)
    saldo -= costoRenovacion;
    costosTotales += costoRenovacion;
    
    // A. Interés sobre el saldo que viene del mes anterior
    // (El mes 1 genera intereses sobre el capital inicial antes de costos/aportes)
    let interesMes = saldo * rMensual;
    saldo += interesMes;
	
    let gananciaNeta = saldo - inversionBruta;
    
    proyeccion.push(
        `Mes ${i} | Invertido: $${inversionBruta.toLocaleString()} | Costo Acum: $${costosTotales.toFixed(4)} | Total: $${saldo.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`
    );
}

// 3. SALIDA FINAL
print("RESULTADOS GENERALES:");

print("   - Inversión de tu bolsillo: $ " + inversionBruta.toFixed(2));
print("   - Gastos de Renovación (Total): $ " + costosTotales.toFixed(2));
print("   - Ganancia Real: $ " + (saldo - inversionBruta).toFixed(2));
print("   - Saldo Final: $ " + saldo.toFixed(2));

print("Detalle de la evolución:");
print(proyeccion.join("\n"));

