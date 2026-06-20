import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

const R = 1.6

// Convert lat/lng to a point on the sphere surface.
function latLngToVec(lat: number, lng: number, radius = R): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

// Civic pins — Dubai is the anchor, the rest give the globe life.
const PINS: { lat: number; lng: number; lead?: boolean }[] = [
  { lat: 25.2, lng: 55.27, lead: true }, // Dubai
  { lat: 40.71, lng: -74.0 },
  { lat: 51.5, lng: -0.12 },
  { lat: 35.68, lng: 139.69 },
  { lat: -23.55, lng: -46.63 },
  { lat: 1.35, lng: 103.82 },
  { lat: 48.85, lng: 2.35 },
]

function DottedGlobe() {
  const positions = useMemo(() => {
    const N = 1700
    const arr = new Float32Array(N * 3)
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const t = golden * i
      arr[i * 3] = Math.cos(t) * r * R
      arr[i * 3 + 1] = y * R
      arr[i * 3 + 2] = Math.sin(t) * r * R
    }
    return arr
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.027} color="#d8cdb0" transparent opacity={0.92} sizeAttenuation />
    </points>
  )
}

function Pin({ lat, lng, lead }: { lat: number; lng: number; lead?: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null)
  const pos = useMemo(() => latLngToVec(lat, lng), [lat, lng])
  const quat = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0)
    const normal = pos.clone().normalize()
    return new THREE.Quaternion().setFromUnitVectors(up, normal)
  }, [pos])
  const [phase] = useState(() => Math.random() * Math.PI * 2)

  useFrame(({ clock }) => {
    if (!ringRef.current) return
    const period = 2.6
    const tt = ((clock.elapsedTime + phase) % period) / period
    const s = 0.04 + tt * 0.22
    ringRef.current.scale.set(s, s, s)
    const mat = ringRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = (1 - tt) * 0.8
  })

  const color = '#e0a23a'
  const beam = lead ? 0.5 : 0.32

  return (
    <group position={pos} quaternion={quat}>
      {/* marker */}
      <mesh>
        <sphereGeometry args={[lead ? 0.05 : 0.035, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* light beam */}
      <mesh position={[0, beam / 2, 0]}>
        <cylinderGeometry args={[0.006, 0.006, beam, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
      {/* pulse ring, laid flat on the surface */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 1, 32]} />
        <meshBasicMaterial color={color} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Scene() {
  return (
    <group rotation={[0.35, 0, 0.1]}>
      {/* faint survey shell */}
      <mesh>
        <icosahedronGeometry args={[R * 0.995, 6]} />
        <meshBasicMaterial color="#8a93a8" wireframe transparent opacity={0.1} />
      </mesh>
      <DottedGlobe />
      {PINS.map((p, i) => (
        <Pin key={i} {...p} />
      ))}
    </group>
  )
}

export default function Globe3D() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 4.4], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <Scene />
      {/* grab to spin; auto-rotates when idle */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
      />
    </Canvas>
  )
}
