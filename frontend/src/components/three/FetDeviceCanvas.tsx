"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import type { MotionValue } from "motion/react";

/* ─── Fuel Eco Tech device, in real time ──────────────────────────────────────
   Modelled from the product packshot: an anodised black body with a machined
   cap, a beaded neck and a fuel nozzle at each end, turned (lathed) from
   profiles so it stays a few kilobytes rather than a downloaded model.

   Two inputs, both 0→1 motion values driven by scroll:
     • spin — turns the device a full revolution;
     • open — lifts the cap and lowers the base, and fades the body to an
       X-ray so the swirl chamber inside shows. The swirl is an ILLUSTRATION
       of the principle the manufacturer describes, and is labelled as such
       wherever it is shown.                                                 */

type V2 = [number, number];
const lathe = (pts: V2[], seg = 96) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);

const BODY: V2[] = [[0, -1.0], [0.4, -1.0], [0.42, -0.975], [0.42, 0.5], [0, 0.5]];
const CAP: V2[] = [
  [0, 0.5], [0.44, 0.5], [0.448, 0.53], [0.448, 0.6], [0.43, 0.612], [0.43, 0.638], [0.448, 0.65],
  [0.448, 0.735], [0.425, 0.775], [0.18, 0.795], [0, 0.795],
];
const TOP: V2[] = [
  [0, 0.79], [0.17, 0.79], [0.17, 1.02], [0.198, 1.035], [0.214, 1.09], [0.198, 1.145], [0.17, 1.16],
  [0.17, 1.22], [0.152, 1.24], [0.152, 1.9], [0.132, 1.95], [0, 1.95],
];
const BASE: V2[] = [
  [0, -0.995], [0.31, -0.995], [0.31, -1.045], [0.17, -1.06], [0.17, -1.25], [0.198, -1.265], [0.214, -1.32],
  [0.198, -1.375], [0.17, -1.39], [0.152, -1.45], [0.152, -1.95], [0.132, -2.0], [0, -2.0],
];

/* The printed mark on the body, drawn once to a canvas. */
function useLabelTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 256;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = "rgba(226,226,222,0.92)";
    // drop icon
    g.beginPath();
    g.moveTo(250, 70);
    g.bezierCurveTo(215, 120, 200, 145, 200, 165);
    g.arc(250, 165, 50, Math.PI, 0, true);
    g.bezierCurveTo(300, 145, 285, 120, 250, 70);
    g.fill();
    g.font = "600 76px 'Hanken Grotesk', 'Helvetica Neue', Arial, sans-serif";
    g.textBaseline = "middle";
    g.fillText("Fuel Eco Tech", 320, 160);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, []);
}

function Device({ spin, open }: { spin?: MotionValue<number>; open?: MotionValue<number> }) {
  const root = useRef<THREE.Group>(null);
  const top = useRef<THREE.Group>(null);
  const base = useRef<THREE.Group>(null);
  const swirl = useRef<THREE.Group>(null);
  const shellMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const labelMat = useRef<THREE.MeshBasicMaterial>(null);
  const label = useLabelTexture();

  const geo = useMemo(() => ({ body: lathe(BODY), cap: lathe(CAP), top: lathe(TOP), base: lathe(BASE) }), []);
  const helix = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 400; i++) {
      const t = i / 400;
      const a = t * Math.PI * 2 * 4.5;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.27, -0.88 + t * 1.3, Math.sin(a) * 0.27));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 600, 0.032, 16, false);
  }, []);
  useEffect(() => () => { Object.values(geo).forEach((g) => g.dispose()); helix.dispose(); label.dispose(); }, [geo, helix, label]);

  const eased = useRef({ spin: 0, open: 0 });
  useFrame((state, dt) => {
    const k = 1 - Math.pow(0.0015, dt); // frame-rate independent smoothing
    eased.current.spin += ((spin?.get() ?? 0) - eased.current.spin) * k;
    eased.current.open += ((open?.get() ?? 0) - eased.current.open) * k;
    const s = eased.current.spin;
    const o = eased.current.open;
    const t = state.clock.elapsedTime;

    if (root.current) {
      root.current.rotation.y = -0.5 + s * Math.PI * 2 + t * 0.12;
      // A little life from the pointer, never more than a few degrees.
      root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, state.pointer.y * -0.12, 0.05);
      root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, 0.08 + state.pointer.x * -0.06, 0.05);
      root.current.position.y = Math.sin(t * 0.9) * 0.04;
    }
    if (top.current) top.current.position.y = o * 0.46;
    if (base.current) base.current.position.y = -o * 0.3;
    if (shellMat.current) {
      // `transparent` is set once at creation: flipping it later needs a
      // shader recompile, and the body would stay solid.
      shellMat.current.opacity = 1 - o * 0.8;
      shellMat.current.depthWrite = o < 0.5;
    }
    if (labelMat.current) labelMat.current.opacity = 1 - o * 0.9;
    if (swirl.current) {
      swirl.current.rotation.y = -t * 1.4;
      swirl.current.scale.setScalar(0.6 + o * 0.4);
      (swirl.current.children as THREE.Mesh[]).forEach((m) => {
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.opacity = Math.min(1, o * 1.6);
        mat.emissiveIntensity = 0.35 + o * 0.9;
      });
    }
  });

  const black = { color: "#151515", metalness: 0.82, roughness: 0.34, clearcoat: 0.55, clearcoatRoughness: 0.28 } as const;

  return (
    <group ref={root} scale={0.92}>
      <group ref={top}>
        <mesh geometry={geo.cap}><meshPhysicalMaterial {...black} /></mesh>
        <mesh geometry={geo.top}><meshPhysicalMaterial {...black} roughness={0.28} /></mesh>
      </group>

      <mesh geometry={geo.body}>
        <meshPhysicalMaterial ref={shellMat} {...black} transparent />
      </mesh>
      {/* Printed mark: a thin sleeve just proud of the body, facing the viewer at rest. */}
      <mesh position={[0, -0.18, 0]} rotation={[0, Math.PI * 0.5 + 0.5, 0]}>
        <cylinderGeometry args={[0.4215, 0.4215, 0.4, 64, 1, true, -0.95, 1.9]} />
        <meshBasicMaterial ref={labelMat} map={label} transparent depthWrite={false} side={THREE.FrontSide} />
      </mesh>

      <group ref={swirl}>
        <mesh geometry={helix}>
          <meshStandardMaterial color="#C5B27A" emissive="#7A6020" metalness={1} roughness={0.22} transparent opacity={0} />
        </mesh>
        <mesh position={[0, -0.23, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 1.3, 32]} />
          <meshStandardMaterial color="#5A4A22" emissive="#3A2E12" metalness={0.9} roughness={0.4} transparent opacity={0} />
        </mesh>
      </group>

      <group ref={base}>
        <mesh geometry={geo.base}><meshPhysicalMaterial {...black} roughness={0.28} /></mesh>
      </group>
    </group>
  );
}

export default function FetDeviceCanvas({ spin, open, onReady }: { spin?: MotionValue<number>; open?: MotionValue<number>; onReady?: () => void }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.1, 8.6], fov: 32 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={() => onReady?.()}
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <directionalLight position={[-4, -1, -3]} intensity={0.6} color="#C5B27A" />
      <Device spin={spin} open={open} />
      {/* Studio lighting built from soft panels, so no HDR file is downloaded. */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.2} rotation-x={Math.PI / 2} position={[0, 4, -6]} scale={[10, 1.2, 1]} />
        <Lightformer intensity={1.6} rotation-y={Math.PI / 2} position={[-5, 0.5, -1]} scale={[14, 0.6, 1]} />
        <Lightformer intensity={1.4} color="#E9D9A8" rotation-y={-Math.PI / 2} position={[5, 0.5, 0]} scale={[14, 0.9, 1]} />
        <Lightformer form="ring" intensity={0.8} scale={3} position={[0, 1, 7]} />
      </Environment>
    </Canvas>
  );
}
