import './style.css';
import { SceneManager } from './scene';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize 3D Scene
  const sceneManager = new SceneManager('canvas-container');
  
  // UI Interactions
  const animateBtn = document.getElementById('btn-animate-route');
  
  if (animateBtn) {
    animateBtn.addEventListener('click', () => {
      // Dummy Coordinates for Goa trip (Mumbai -> Goa approximation)
      // Mumbai: 19.0760° N, 72.8777° E
      // Goa: 15.2993° N, 74.1240° E
      const startLat = 19.0760;
      const startLng = 72.8777;
      const endLat = 15.2993;
      const endLng = 74.1240;
      
      sceneManager.animateRoute(startLat, startLng, endLat, endLng);
      
      // Visual feedback on button
      animateBtn.innerText = "Crafting Route... 🚀";
      setTimeout(() => {
        animateBtn.innerText = "Journey Generated ✨";
        animateBtn.style.background = "linear-gradient(135deg, #00C9FF, #92FE9D)";
      }, 1000);
    });
  }
  
  // Sidebar Trip Interactions
  const tripCards = document.querySelectorAll('.trip-card');
  tripCards.forEach(card => {
    card.addEventListener('click', () => {
      const title = card.querySelector('h4')?.innerText;
      if (title === 'Kyoto Serenity') {
        // Tokyo to Kyoto
        sceneManager.animateRoute(35.6762, 139.6503, 35.0116, 135.7681);
      } else if (title === 'Patagonia Trails') {
        // Buenos Aires to Patagonia
        sceneManager.animateRoute(-34.6037, -58.3816, -50.3379, -72.2653);
      }
    });
  });
});
