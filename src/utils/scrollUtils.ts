/**
 * Desplazamiento suave a un elemento por su ID con velocidad constante y offset para header fijo.
 * 
 * @param targetId ID del elemento destino
 * @param offset Offset para compensar el header (por defecto 80px)
 * @param duration Duración de la animación en ms (por defecto 800ms)
 */
export const smoothScrollTo = (targetId: string, offset: number = 80, duration: number = 800) => {
  const elem = document.getElementById(targetId);
  
  if (elem) {
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = elem.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;

    const startPosition = window.pageYOffset;
    const distance = offsetPosition - startPosition;
    let start: number | null = null;

    const animation = (currentTime: number) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        // Asegurar que llegamos exactamente a la posición final
        window.scrollTo(0, offsetPosition);
      }
    };

    // Función de easing para suavidad
    function easeInOutQuad(t: number, b: number, c: number, d: number) {
      t /= d / 2;
      if (t < 1) return (c / 2) * t * t + b;
      t--;
      return (-c / 2) * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
    
    // Update URL hash without jumping
    window.history.pushState(null, "", `#${targetId}`);
  }
};
