# Guía de Contribución

¡Gracias por tu interés en contribuir a Match-3! 🎉

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Cómo Contribuir](#cómo-contribuir)
- [Proceso de Desarrollo](#proceso-de-desarrollo)
- [Estándares de Código](#estándares-de-código)
- [Commits](#commits)
- [Pull Requests](#pull-requests)

---

## 📜 Código de Conducta

Este proyecto se adhiere a un código de conducta. Al participar, se espera que mantengas este código.

---

## 🤝 Cómo Contribuir

### Reportar Bugs

1. Verifica que el bug no haya sido reportado antes
2. Abre un [nuevo issue](https://github.com/usuario/Match-3/issues/new)
3. Incluye:
   - Descripción clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots si aplica
   - Información del sistema (OS, navegador, versión de Node)

### Sugerir Features

1. Abre un [nuevo issue](https://github.com/usuario/Match-3/issues/new)
2. Describe claramente la feature
3. Explica por qué sería útil
4. Proporciona ejemplos de uso

---

## 💻 Proceso de Desarrollo

### 1. Fork y Clone

```bash
# Fork el repositorio en GitHub
# Luego clona tu fork
git clone https://github.com/TU-USUARIO/Match-3.git
cd Match-3
```

### 2. Crear Branch

```bash
# Crea un branch desde develop
git checkout develop
git checkout -b feature/mi-nueva-feature
```

### 3. Configurar Entorno

```bash
# Instalar dependencias
cd programa/server && npm install
cd ../client && npm install

# Configurar pre-commit hooks
npm run prepare
```

### 4. Hacer Cambios

- Escribe código limpio y bien documentado
- Agrega tests para nuevas features
- Actualiza documentación si es necesario

### 5. Ejecutar Tests

```bash
# Servidor
cd programa/server
npm test
npm run lint

# Cliente
cd programa/client
npm test
npm run lint
```

### 6. Commit

```bash
# Los commits deben seguir Conventional Commits
git add .
git commit -m "feat: agregar nueva funcionalidad"
```

### 7. Push y PR

```bash
git push origin feature/mi-nueva-feature
```

Luego abre un Pull Request en GitHub.

---

## 📝 Estándares de Código

### TypeScript

- Usa TypeScript strict mode
- Define tipos explícitos
- Evita `any`

```typescript
// ✅ Bien
function calcularPuntaje(matches: number): number {
  return matches * 10;
}

// ❌ Mal
function calcularPuntaje(matches: any): any {
  return matches * 10;
}
```

### Naming Conventions

- **Variables/Funciones**: camelCase
- **Clases/Interfaces**: PascalCase
- **Constantes**: UPPER_SNAKE_CASE
- **Archivos**: kebab-case o PascalCase para componentes

```typescript
// Variables y funciones
const jugadorActual = "Juan";
function obtenerPuntaje() {}

// Clases e interfaces
class TableroJuego {}
interface ConfiguracionPartida {}

// Constantes
const MAX_JUGADORES = 4;
```

### Formato

- **Indentación**: 2 espacios
- **Comillas**: Simples para strings
- **Punto y coma**: Requerido
- **Prettier**: Configurado automáticamente

---

## 📦 Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: Nueva feature
- `fix`: Bug fix
- `docs`: Documentación
- `style`: Formateo, punto y coma faltante, etc
- `refactor`: Refactorización de código
- `test`: Agregar tests
- `chore`: Mantenimiento

### Ejemplos

```bash
feat(game): agregar sistema de power-ups
fix(socket): corregir desconexión inesperada
docs(readme): actualizar guía de instalación
refactor(board): simplificar lógica de matches
test(game-service): agregar tests unitarios
```

---

## 🔄 Pull Requests

### Checklist

Antes de abrir un PR, verifica:

- [ ] El código compila sin errores
- [ ] Todos los tests pasan
- [ ] El código está formateado (Prettier)
- [ ] No hay errores de linting
- [ ] Agregaste tests para nuevas features
- [ ] Actualizaste la documentación
- [ ] El commit sigue Conventional Commits

### Template de PR

```markdown
## Descripción
Breve descripción de los cambios

## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva feature
- [ ] Breaking change
- [ ] Documentación

## ¿Cómo se ha probado?
Describe los tests realizados

## Screenshots (si aplica)
Agrega screenshots

## Checklist
- [ ] Mi código sigue los estándares del proyecto
- [ ] He revisado mi propio código
- [ ] He comentado código complejo
- [ ] He actualizado la documentación
- [ ] Mis cambios no generan nuevos warnings
- [ ] He agregado tests
- [ ] Todos los tests pasan
```

---

## 🧪 Testing

### Unit Tests

```typescript
describe('GameService', () => {
  it('should calculate score correctly', () => {
    const score = calculateScore(3);
    expect(score).toBe(30);
  });
});
```

### Coverage

Mantenemos >80% de cobertura:

```bash
npm run test:coverage
```

---

## 📚 Recursos

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## ❓ Preguntas

Si tienes preguntas, abre un [issue](https://github.com/usuario/Match-3/issues) o contacta a los maintainers.

---

¡Gracias por contribuir! 🙌
