"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import type { Product } from "@/lib/api/types";

/**
 * The 3D showroom.
 *
 * Loaded only after the visitor asks for it -- see BoutiqueStage -- so none of
 * three.js reaches anyone who does not open it.
 *
 * A deliberate limitation, stated plainly: these are not 3D models of the
 * watches. We do not have geometry for real MAK pieces, and modelling one from
 * a photograph would be inventing how a product looks. What the room contains
 * is the *actual product photography*, mounted and lit in a space you can walk
 * around -- and, for a piece with no photograph on file, a card bearing its
 * real name. Nothing here is a guess at how a product looks.
 */

export interface ShowroomProps {
  products: Product[];
  /** Called when a plinth is picked, so the page can show the details panel. */
  onSelect: (product: Product | null) => void;
  selectedId: string | null;
}

/** Palette, matching the design tokens rather than inventing new colours. */
const GROUND = 0xf3f2f2;
const SURFACE = 0xeae9e9;
const ACCENT = 0xec3013;

export default function Showroom({
  products,
  onSelect,
  selectedId,
}: ShowroomProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  // Kept in refs so the render loop reads live values without being rebuilt.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(GROUND);
    scene.fog = new THREE.Fog(GROUND, 14, 34);

    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 2.6, 9.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    // Capped: on a high-DPI phone an uncapped ratio quadruples the pixels for
    // no visible gain and a great deal of heat.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.minDistance = 5;
    controls.maxDistance = 15;
    // Stop short of the floor plane and of the ceiling, so the room can never
    // be turned inside out.
    controls.minPolarAngle = 0.6;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.target.set(0, 1.2, 0);

    // --- The room -------------------------------------------------------
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(16, 64),
      new THREE.MeshStandardMaterial({ color: SURFACE, roughness: 0.85 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // A low ring wall, so the space reads as a room rather than an empty void.
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(16, 16, 9, 64, 1, true),
      new THREE.MeshStandardMaterial({
        color: GROUND,
        side: THREE.BackSide,
        roughness: 1,
      })
    );
    wall.position.y = 4.5;
    scene.add(wall);

    scene.add(new THREE.HemisphereLight(0xffffff, SURFACE, 1.15));

    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(5, 9, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 30;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-6, 5, -4);
    scene.add(fill);

    // --- The pieces -----------------------------------------------------
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    /**
     * Texture URLs go through our own media route rather than straight to the
     * storage host.
     *
     * A WebGL texture is read back by the GPU, so the browser requires CORS on
     * the image response -- and the storage bucket does not send it. Serving
     * the bytes from our own origin is what makes the texture usable.
     *
     * This was /_next/image until image optimization was switched off (the
     * Vercel quota is exhausted; see next.config.ts), which took that route
     * with it and left every texture 404ing. See src/app/api/media/route.ts.
     */
    const textureURL = (src: string) =>
      src.startsWith("/") && !src.startsWith("//")
        ? src
        : `/api/media?url=${encodeURIComponent(src)}`;

    /**
     * The card shown for a piece with no photograph on file.
     *
     * Its name, drawn legibly, rather than a blank white rectangle. Nothing is
     * invented here: it is the product's real name, and the piece stays
     * selectable and shoppable exactly as any other.
     */
    const nameCard = (name: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.fillStyle = "#eae9e9";
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = "#201e1d";
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, 504, 504);

      ctx.fillStyle = "#201e1d";
      ctx.font = "600 34px system-ui, sans-serif";
      ctx.textAlign = "center";

      // Wrap on words so a long product name stays inside the card.
      const words = name.split(/\s+/);
      const lines: string[] = [];
      let line = "";
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (ctx.measureText(candidate).width > 430 && line) {
          lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      }
      if (line) lines.push(line);

      const shown = lines.slice(0, 5);
      const startY = 256 - ((shown.length - 1) * 44) / 2;
      shown.forEach((text, i) => ctx.fillText(text, 256, startY + i * 44));

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    const disposables: { dispose: () => void }[] = [];
    const pickable: THREE.Mesh[] = [];
    const plinths: THREE.Mesh[] = [];

    const radius = Math.max(3.4, products.length * 0.62);

    products.forEach((product, index) => {
      const angle = (index / products.length) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const plinthGeo = new THREE.CylinderGeometry(0.62, 0.68, 1.1, 32);
      const plinthMat = new THREE.MeshStandardMaterial({
        color: SURFACE,
        roughness: 0.6,
      });
      const plinth = new THREE.Mesh(plinthGeo, plinthMat);
      plinth.position.set(x, 0.55, z);
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      scene.add(plinth);
      plinths.push(plinth);
      disposables.push(plinthGeo, plinthMat);

      // The product's own photograph, standing on the plinth. Double-sided so
      // it stays visible from behind rather than vanishing as you orbit past.
      const panelGeo = new THREE.PlaneGeometry(1.25, 1.25);
      const panelMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(x, 1.85, z);
      panel.userData.productId = product.id;
      scene.add(panel);
      pickable.push(panel);
      disposables.push(panelGeo, panelMat);

      const fallback = () => {
        const texture = nameCard(product.name);
        if (!texture) return;
        panelMat.map = texture;
        panelMat.needsUpdate = true;
        disposables.push(texture);
      };

      const src = product.images?.[0];
      if (!src) {
        // No photograph on file for this piece -- most of the catalogue is in
        // this state today, so a blank room would be the common case.
        fallback();
      } else {
        loader.load(
          textureURL(src),
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            panelMat.map = texture;
            panelMat.needsUpdate = true;
            disposables.push(texture);
          },
          undefined,
          fallback
        );
      }
    });

    // --- Picking ---------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downAt = { x: 0, y: 0 };

    const onPointerDown = (event: PointerEvent) => {
      downAt = { x: event.clientX, y: event.clientY };
    };

    const onPointerUp = (event: PointerEvent) => {
      // An orbit drag must not count as a click on whatever ends up under the
      // cursor when the drag stops.
      const moved =
        Math.abs(event.clientX - downAt.x) + Math.abs(event.clientY - downAt.y);
      if (moved > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const hit = raycaster.intersectObjects(pickable, false)[0];
      if (!hit) {
        onSelectRef.current(null);
        return;
      }
      const id = (hit.object as THREE.Mesh).userData.productId as string;
      onSelectRef.current(products.find((p) => p.id === id) ?? null);
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    // --- Loop ------------------------------------------------------------
    const clock = new THREE.Clock();
    let frame = 0;

    const render = () => {
      frame = requestAnimationFrame(render);
      const t = clock.getElapsedTime();

      pickable.forEach((panel, index) => {
        // Always face the viewer: a photograph seen edge-on is a line.
        panel.lookAt(camera.position);
        const chosen = panel.userData.productId === selectedRef.current;
        const lift = chosen ? 0.18 : 0;
        panel.position.y =
          1.85 + lift + Math.sin(t * 0.9 + index) * 0.035;
        const plinth = plinths[index];
        (plinth.material as THREE.MeshStandardMaterial).color.setHex(
          chosen ? ACCENT : SURFACE
        );
      });

      controls.update();
      renderer.render(scene, camera);
    };
    render();
    setReady(true);

    const onResize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    const observer = new ResizeObserver(onResize);
    observer.observe(mount);

    // --- Teardown --------------------------------------------------------
    // WebGL contexts and GPU memory are not garbage collected with the React
    // tree. Everything allocated above is released here; without this, opening
    // the showroom a few times exhausts the browser's context limit.
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      controls.dispose();

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((m) => m.dispose());
          else material?.dispose();
        }
      });
      disposables.forEach((item) => item.dispose());

      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [products]);

  return (
    <div
      ref={mountRef}
      className="h-[min(70vh,620px)] w-full border-2 border-mak-line bg-mak-surface"
      // The canvas is decorative: everything in it is reachable from the grid
      // below, which is the accessible path through this page.
      aria-hidden="true"
    >
      {!ready ? (
        <p className="p-6 text-mak-small text-mak-muted">Building the room…</p>
      ) : null}
    </div>
  );
}
