import { Celda } from './Celda.js';

describe('Celda', () => {
  it('debería crearse con un color específico', () => {
    const celda = new Celda(0, 0, 'red');
    expect(celda.colorID).toBe('red');
    expect(celda.fila).toBe(0);
    expect(celda.columna).toBe(0);
    expect(celda.estado).toBe('libre');
  });

  it('debería generar un color aleatorio si se pasa una lista', () => {
    const colores = ['red', 'blue', 'green'];
    const celda = new Celda(1, 1, colores);
    expect(colores).toContain(celda.colorID);
  });

  it('debería cambiar de color correctamente', () => {
    const celda = new Celda(0, 0, 'red');
    celda.asignarColor('blue');
    expect(celda.colorID).toBe('blue');
  });

  it('debería cambiar de estado', () => {
    const celda = new Celda(0, 0, 'red');
    celda.establecerEstado('bloqueada');
    expect(celda.estado).toBe('bloqueada');
  });

  it('debería devolver sus coordenadas', () => {
    const celda = new Celda(5, 3, 'red');
    expect(celda.obtenerCoordenadas()).toEqual({ r: 5, c: 3 });
  });
});
