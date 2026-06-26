export const CATEGORIES: Record<string, string[]> = {
  'comida': ['comida', 'compras', 'supermercado', 'mercado', 'despensa', 'alimentos', 'comer', 'restaurante', 'cenar', 'almorzar', 'desayunar', 'café', 'cafe', 'bebida', 'uber eats', 'rapp i', 'didi food', 'pedidos ya'],
  'transporte': ['transporte', 'uber', 'taxi', 'didi', 'cabify', 'camión', 'camion', 'autobús', 'autobus', 'metro', 'combustible', 'gasolina', 'gas', 'estacionamiento', 'pasaje', 'boleto'],
  'entretenimiento': ['entretenimiento', 'cine', 'netflix', 'spotify', 'disney', 'hbo', 'prime', 'video', 'juego', 'suscripción', 'suscripcion', 'música', 'musica', 'concierto'],
  'servicios': ['servicio', 'luz', 'agua', 'gas', 'internet', 'teléfono', 'telefono', 'celular', 'predial', 'renta', 'suscripción'],
  'salud': ['salud', 'médico', 'medico', 'doctor', 'hospital', 'farmacia', 'medicina', 'dentista', 'seguro'],
  'educación': ['educación', 'educacion', 'colegiatura', 'curso', 'clase', 'universidad', 'libro', 'escuela'],
  'ropa': ['ropa', 'vestimenta', 'zapatos', 'calzado', 'accesorio'],
  'hogar': ['hogar', 'casa', 'mueble', 'electrodoméstico', 'reparacion', 'reparación', 'mantenimiento'],
  'ingreso': ['sueldo', 'salario', 'nómina', 'nomina', 'pago', 'freelance', 'honorarios', 'venta', 'devolución', 'devolucion', 'reembolso', 'regalo', 'bonus', 'bono', 'comisión'],
  'transferencia': ['transferencia', 'transferir', 'transfiere', 'mover', 'pasar'],
}

export const ACCOUNT_SYNONYMS: Record<string, string[]> = {
  'efectivo': ['efectivo', 'cash', 'efect'],
  'débito': ['débito', 'debito', 'debito', 'tarjeta de débito', 'tdc'],
  'crédito': ['crédito', 'credito', 'tarjeta de crédito', 'tarjeta credito', 'tcredito', 'tc'],
  'ahorro': ['ahorro', 'ahorros', 'alcancía'],
  'inversión': ['inversión', 'inversion', 'inversiones', 'invertido'],
  'otra': ['otra', 'otro'],
}

export const MONTH_NAMES: Record<string, number> = {
  'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
  'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
  'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
  'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11,
}

export const AMOUNT_WORDS: Record<string, number> = {
  'cien': 100, 'doscientos': 200, 'trescientos': 300, 'quinientos': 500,
  'mil': 1000, 'dosmil': 2000,
}
