## Nueva Característica: Sistema de 4 Cuerpos (Añadir Asteroide)

**Objetivo:** Extender la simulación de 3 cuerpos a 4 cuerpos permitiendo la inyección de un asteroide mediante la interfaz de usuario.

### 1. Interfaz de Usuario (UI)
* **Botón:** Agrega un botón "Añadir Asteroide". Al pulsarlo, el asteroide entra a la simulación. Solo puede haber un asteroide a la vez.
* **Controles (Sliders):** Agrega dos sliders para definir la posición inicial antes de lanzarlo:
  * `Distancia al Sol (R)`: Con un rango que permita ubicarlo desde más cerca de la Tierra hasta un poco más lejos.
  * `Ángulo (θ)`: De 0 a 360 grados respecto al Sol.

### 2. Especificaciones Físicas y Técnicas (El Motor)
* **Masa:** La masa del asteroide debe ser exactamente el **1% de la masa de la Luna** (`masa_luna * 0.01`).
* **Expansión del RK4:** El integrador numérico debe ser capaz de manejar arreglos de tamaño 4 (Sol, Tierra, Luna, Asteroide). Asegúrate de actualizar el cálculo de la aceleración para que sume las interacciones de los 4 cuerpos.
* **Velocidad Inicial (CRÍTICO):** Cuando el asteroide se inyecta, **no debe estar quieto**. Calcula automáticamente su vector de velocidad inicial para que tenga una órbita circular estable alrededor del Sol en esa distancia `R` (velocidad tangencial), para que actúe como un asteroide real.

### 3. Visualización en Three.js / Canvas
* **Representación:** Una esfera/punto muy pequeño de color **naranja** o **blanco brillante**.
* **Trayectoria (Trail):** Debe dejar una estela igual que los planetas para ver sus perturbaciones y su órbita cruzada.

### 4. Comportamiento Físico Esperado (Validación)
El código debe respetar estrictamente las leyes de Newton para que se cumplan las siguientes observaciones:
1. **El Asteroide:** Orbitará el Sol. Su trayectoria se volverá caótica si cruza la Esfera de Hill de la Tierra/Luna.
2. **La Tierra:** Su órbita debe permanecer prácticamente inalterada (debido a su enorme masa frente al asteroide).
3. **La Luna:** Debe ser sensible a perturbaciones. Si hay un encuentro cercano con el asteroide, su excentricidad debe verse afectada (oscilaciones adicionales).
4. **Casos Extremos:** Si ocurre una colisión o captura temporal, el RK4 debe mantener la estabilidad numérica (la energía total del sistema de 4 cuerpos debe seguir conservándose).