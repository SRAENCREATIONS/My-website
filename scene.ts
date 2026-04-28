import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';

export class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  
  private earth!: THREE.Mesh;
  private clouds!: THREE.Mesh;
  private flightPaths: THREE.Group;
  
  constructor(containerId: string) {
    this.container = document.getElementById(containerId) as HTMLElement;
    
    // Setup Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020205);
    
    // Setup Camera
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, 20); // Cinematic starting position
    
    // Setup Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);
    
    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 30;
    this.controls.enablePan = false;
    
    this.flightPaths = new THREE.Group();
    this.scene.add(this.flightPaths);
    
    this.createEarth();
    this.createLighting();
    this.createStars();
    
    // Handle resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Animation Loop
    this.tick();
  }
  
  private createEarth() {
    // Earth Geometry
    const geometry = new THREE.SphereGeometry(5, 64, 64);
    
    // High-contrast stylized material (Dark mode vibe)
    const material = new THREE.MeshStandardMaterial({
      color: 0x11111a,
      roughness: 0.7,
      metalness: 0.1,
    });
    
    this.earth = new THREE.Mesh(geometry, material);
    this.scene.add(this.earth);
    
    // Wireframe overlay for "tech" look (Stylized regional map vibe)
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x8A2BE2,
      wireframe: true,
      transparent: true,
      opacity: 0.05
    });
    const wireframe = new THREE.Mesh(geometry, wireframeMat);
    wireframe.scale.setScalar(1.001);
    this.earth.add(wireframe);
    
    // Atmosphere Glow (simple fresnel-like shader approximation using additive blending)
    const atmosphereGeo = new THREE.SphereGeometry(5.2, 64, 64);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x4B0082,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    this.scene.add(atmosphere);
    
    // Clouds layer (particles or textured sphere, using simple transparent sphere for now)
    const cloudGeo = new THREE.SphereGeometry(5.05, 64, 64);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
      roughness: 1,
    });
    this.clouds = new THREE.Mesh(cloudGeo, cloudMat);
    this.scene.add(this.clouds);
  }
  
  private createLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 2);
    sunLight.position.set(10, 5, 10);
    this.scene.add(sunLight);
    
    // Subtle purple backfill
    const backLight = new THREE.DirectionalLight(0x8A2BE2, 1.5);
    backLight.position.set(-10, -5, -10);
    this.scene.add(backLight);
  }
  
  private createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const count = 2000;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 100;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      size: 0.1,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
  }
  
  // Convert Lat/Lon to Vector3
  private getCoordinatesFromLatLng(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    
    return new THREE.Vector3(x, y, z);
  }
  
  public animateRoute(startLat: number, startLng: number, endLat: number, endLng: number) {
    const start = this.getCoordinatesFromLatLng(startLat, startLng, 5);
    const end = this.getCoordinatesFromLatLng(endLat, endLng, 5);
    
    // Calculate distance for curve height
    const distance = start.distanceTo(end);
    const midPoint = start.clone().lerp(end, 0.5);
    midPoint.normalize().multiplyScalar(5 + distance * 0.3); // Arc height
    
    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
    const points = curve.getPoints(50);
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0,
      linewidth: 2
    });
    
    const line = new THREE.Line(geometry, material);
    this.flightPaths.add(line);
    
    // Draw animation
    gsap.to(material, {
      opacity: 1,
      duration: 1,
      ease: "power2.out"
    });
    
    // Animate Camera to Route
    gsap.to(this.camera.position, {
      x: midPoint.x * 2,
      y: midPoint.y * 2,
      z: midPoint.z * 2,
      duration: 2.5,
      ease: "power3.inOut",
      onUpdate: () => {
        this.camera.lookAt(0, 0, 0);
      }
    });
  }
  
  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  private tick() {
    requestAnimationFrame(this.tick.bind(this));
    
    // Slowly rotate earth and clouds
    if (this.earth) this.earth.rotation.y += 0.0005;
    if (this.clouds) {
      this.clouds.rotation.y += 0.0007;
      this.clouds.rotation.z += 0.0001;
    }
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
