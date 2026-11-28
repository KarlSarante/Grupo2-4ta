/**
 * HU-034: Calculos presupuestarios compartidos.
 * Los importes se operan en centavos enteros.
 */

export function convertirACentavos(valor) {
    if (typeof valor !== "number" && typeof valor !== "string") {
        return null;
    }

    const texto = String(valor).trim();

    if (!/^\d+(?:\.\d{1,2})?$/.test(texto)) {
        return null;
    }

    const [entero, decimal = ""] = texto.split(".");

    const centavos =
        Number(entero) * 100 +
        Number(decimal.padEnd(2, "0"));

    return Number.isSafeInteger(centavos)
        ? centavos
        : null;
}

export function calcularEstadoPresupuesto(
    gastadoCentavos,
    limiteCentavos,
    umbralMedio,
    umbralAlto
) {
    if (
        !Number.isSafeInteger(gastadoCentavos) ||
        gastadoCentavos < 0 ||
        !Number.isSafeInteger(limiteCentavos) ||
        limiteCentavos <= 0 ||
        !Number.isInteger(umbralMedio) ||
        !Number.isInteger(umbralAlto) ||
        umbralMedio < 1 ||
        umbralMedio >= umbralAlto ||
        umbralAlto > 100
    ) {
        return null;
    }

    if (gastadoCentavos > limiteCentavos) {
        return "excedido";
    }

    if (gastadoCentavos === limiteCentavos) {
        return "agotado";
    }

    const consumo = BigInt(gastadoCentavos) * 100n;
    const limite = BigInt(limiteCentavos);

    if (consumo >= limite * BigInt(umbralAlto)) {
        return "alto";
    }

    if (consumo >= limite * BigInt(umbralMedio)) {
        return "medio";
    }

    return "normal";
}

export function calcularProyeccionPresupuesto(
    presupuesto,
    montoNuevo = ""
) {
    if (!presupuesto || typeof presupuesto !== "object") {
        return null;
    }

    const limite = convertirACentavos(
        presupuesto.monto_limite
    );

    const gastado = convertirACentavos(
        presupuesto.gastado
    );

    const umbralMedio = Number(presupuesto.umbral_medio);
    const umbralAlto = Number(presupuesto.umbral_alto);

    if (limite === null || limite <= 0 || gastado === null) {
        return null;
    }

    const monto = convertirACentavos(montoNuevo);

    const montoValido =
        monto !== null &&
        monto > 0 &&
        monto <= 999999999999;

    const proyectado = gastado + (montoValido ? monto : 0);

    if (!Number.isSafeInteger(proyectado)) {
        return null;
    }

    const estado = calcularEstadoPresupuesto(
        proyectado,
        limite,
        umbralMedio,
        umbralAlto
    );

    if (estado === null) {
        return null;
    }

    const porcentaje = (proyectado / limite) * 100;

    return {
        limiteCentavos: limite,
        gastadoCentavos: gastado,
        montoNuevoCentavos: montoValido ? monto : 0,
        proyectadoCentavos: proyectado,
        disponibleCentavos: limite - proyectado,
        porcentaje,
        porcentajeBarra: Math.min(porcentaje, 100),
        umbralMedio,
        umbralAlto,
        montoValido,
        estado,
    };
}
