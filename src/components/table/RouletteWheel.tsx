'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  type WheelType,
  type SpinResult,
  getNumberColor,
  getDisplayNumber,
  AMERICAN_WHEEL_ORDER,
  EUROPEAN_WHEEL_ORDER,
} from '@/lib/rng';

interface RouletteWheelProps {
  wheelType: WheelType;
  spinResult: SpinResult | null;
  isSpinning: boolean;
  onSpinComplete: () => void;
  size?: number;
}

const TWO_PI = Math.PI * 2;

// ─── Physics constants ────────────────────────────────────────────────────────
const BALL_ORBIT_START = 0.88;  // fraction of wheel radius
const BALL_ORBIT_END = 0.58;  // fraction where ball drops into pocket
const SPIN_DURATION = 6000;  // ms total spin
const BALL_SETTLE_AT = 0.72;  // fraction into spin when ball starts dropping

function easeOutQuad(t: number) { return 1 - (1 - t) * (1 - t); }
function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RouletteWheel({
  wheelType,
  spinResult,
  isSpinning,
  onSpinComplete,
  size = 460
}: RouletteWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stateRef = useRef({
    // wheel
    wheelAngle: 0,
    wheelVel: 0,
    // ball
    ballAngle: 0,
    ballVel: 0,
    ballRadius: spinResult ? BALL_ORBIT_END : BALL_ORBIT_START,
    ballZ: 0,
    ballBounceVel: 0,
    // spin state
    spinning: false,
    ballSettled: !!spinResult,
    spinStartTime: 0,
    targetPocket: spinResult?.number || 0,
    targetAngle: 0,
    startWheelAngle: 0,
    startBallAngle: 0,
    targetBallAngle: 0,
    // wobble
    wobble: 0,
    // animation
    rafId: 0,
  });

  const pocketOrder = wheelType === 'american' ? AMERICAN_WHEEL_ORDER : EUROPEAN_WHEEL_ORDER;
  const SECTOR_ANGLE = TWO_PI / pocketOrder.length;

  const latestProps = useRef({ pocketOrder, SECTOR_ANGLE, onSpinComplete });
  useEffect(() => {
    latestProps.current = { pocketOrder, SECTOR_ANGLE, onSpinComplete };
  });

  const triggerSpin = useCallback((targetPocket: number) => {
    const s = stateRef.current;
    const { pocketOrder, SECTOR_ANGLE } = latestProps.current;
    const pocketIndex = pocketOrder.indexOf(targetPocket);
    if (pocketIndex === -1) return;

    const pocketAngle = pocketIndex * SECTOR_ANGLE + SECTOR_ANGLE / 2;
    const targetWheelStop = s.wheelAngle + TWO_PI * 5 + Math.random() * TWO_PI;
    const finalPocketScreenAngle = pocketAngle - Math.PI / 2 + targetWheelStop;

    // Ball must rotate backwards by ~3.5 rotations relative to its CURRENT position
    // (Decreased from 6-7 to slow down its visual speed)
    let targetBallAngle = finalPocketScreenAngle;
    while (targetBallAngle > s.ballAngle - TWO_PI * 3) {
      targetBallAngle -= TWO_PI;
    }

    s.spinning = true;
    s.ballSettled = false;
    s.spinStartTime = performance.now();
    s.targetPocket = targetPocket;
    s.startWheelAngle = s.wheelAngle;
    s.targetAngle = targetWheelStop;
    s.startBallAngle = s.ballAngle;
    s.targetBallAngle = targetBallAngle;
    s.wheelVel = 8 + Math.random() * 2;
    s.ballVel = -(10 + Math.random() * 3);
    s.ballRadius = BALL_ORBIT_START;
    s.ballZ = 0;
    s.ballBounceVel = 0;
    s.wobble = 0;
  }, []);

  useEffect(() => {
    if (isSpinning && spinResult && !stateRef.current.spinning) {
      triggerSpin(spinResult.number);
    }
  }, [isSpinning, spinResult, triggerSpin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DPR = window.devicePixelRatio || 1;
    const S = size;
    canvas.width = S * DPR;
    canvas.height = S * DPR;
    canvas.style.width = S + 'px';
    canvas.style.height = S + 'px';
    ctx.scale(DPR, DPR);

    const cx = S / 2;
    const cy = S / 2;
    const R = S * 0.44;

    // ── Draw functions ───────────────────────────────────────────────────────

    function drawOuterBowl() {
      const outerR = R * 1.02;
      const wallR = R * 0.94;
      const wallInnerR = R * 0.87;

      const bowlGrad = ctx!.createRadialGradient(cx - outerR * 0.2, cy - outerR * 0.25, outerR * 0.08, cx, cy, outerR);
      bowlGrad.addColorStop(0, '#9b4f35');
      bowlGrad.addColorStop(0.3, '#7b3625');
      bowlGrad.addColorStop(0.7, '#582114');
      bowlGrad.addColorStop(1, '#2f130c');
      ctx!.beginPath();
      ctx!.arc(cx, cy, outerR, 0, TWO_PI);
      ctx!.fillStyle = bowlGrad;
      ctx!.fill();

      const blueRimGrad = ctx!.createLinearGradient(cx - outerR, cy - outerR, cx + outerR, cy + outerR);
      blueRimGrad.addColorStop(0, '#1a5448');
      blueRimGrad.addColorStop(0.4, '#2b8673');
      blueRimGrad.addColorStop(1, '#154136');
      ctx!.beginPath();
      ctx!.arc(cx, cy, outerR, 0, TWO_PI);
      ctx!.arc(cx, cy, wallR, 0, TWO_PI, true);
      ctx!.fillStyle = blueRimGrad;
      ctx!.fill();

      // Outer wooden band (replaces the previous yellow track ring)
      const woodOuter = ctx!.createRadialGradient(cx - wallR * 0.18, cy - wallR * 0.2, wallInnerR * 0.02, cx, cy, wallR);
      woodOuter.addColorStop(0, '#7a3b24');
      woodOuter.addColorStop(0.45, '#5b2a1a');
      woodOuter.addColorStop(1, '#2b100a');
      ctx!.beginPath();
      ctx!.arc(cx, cy, wallR, 0, TWO_PI);
      ctx!.arc(cx, cy, wallInnerR, 0, TWO_PI, true);
      ctx!.fillStyle = woodOuter;
      ctx!.fill();
    }

    function drawSectors(wheelAngle: number, currentPockets: number[], currentSectorAngle: number) {
      const innerR = R * 0.66;
      const outerR = R * 0.86;

      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(wheelAngle);

      const sectors = currentPockets.map((num, i) => {
        const startA = i * currentSectorAngle - Math.PI / 2;
        const endA = startA + currentSectorAngle;

        let colorHex = '#1a1a1a';
        const colorName = getNumberColor(num);
        if (colorName === 'red') colorHex = '#c13a47';
        if (colorName === 'green') colorHex = '#2e9950';

        return { num, startA, endA, colorHex };
      });

      sectors.forEach(({ num, startA, endA, colorHex }) => {
        ctx!.beginPath();
        ctx!.arc(0, 0, outerR, startA, endA);
        ctx!.arc(0, 0, innerR, endA, startA, true);
        ctx!.closePath();
        ctx!.fillStyle = colorHex;
        ctx!.fill();

        ctx!.beginPath();
        ctx!.arc(0, 0, outerR, startA, endA);
        ctx!.arc(0, 0, innerR, endA, startA, true);
        ctx!.closePath();
        ctx!.strokeStyle = 'rgba(26,26,26,0.65)';
        ctx!.lineWidth = 1.1;
        ctx!.stroke();

        const midA = (startA + endA) / 2;
        const labelR = outerR * 0.955;
        const lx = Math.cos(midA) * labelR;
        const ly = Math.sin(midA) * labelR;

        ctx!.save();
        ctx!.translate(lx, ly);
        ctx!.rotate(midA + Math.PI / 2);
        ctx!.fillStyle = '#f6f7fa';
        ctx!.font = `bold ${R * 0.072}px 'Georgia', serif`;
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'middle';
        ctx!.shadowColor = 'rgba(0,0,0,0.8)';
        ctx!.shadowBlur = 3;
        ctx!.fillText(getDisplayNumber(num), 0, 0);
        ctx!.shadowBlur = 0;
        ctx!.restore();
      });

      // Note: removed the outer yellow divider lines/diamonds to match
      // the more wooden outer rim in your reference wheel.

      ctx!.restore();
    }

    function drawWoodRotor(wheelAngle: number) {
      const rotorOuter = R * 0.63;
      const rotorInner = R * 0.34;

      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(wheelAngle);

      const wood = ctx!.createRadialGradient(-rotorOuter * 0.25, -rotorOuter * 0.22, rotorOuter * 0.08, 0, 0, rotorOuter);
      wood.addColorStop(0, '#7e3f2b');
      wood.addColorStop(0.45, '#5e2a1d');
      wood.addColorStop(1, '#3d180f');
      ctx!.beginPath();
      ctx!.arc(0, 0, rotorOuter, 0, TWO_PI);
      ctx!.fillStyle = wood;
      ctx!.fill();

      for (let i = 0; i < 12; i += 1) {
        const a = (i / 12) * TWO_PI;
        const b = ((i + 1) / 12) * TWO_PI;
        ctx!.beginPath();
        ctx!.arc(0, 0, rotorOuter * 0.985, a + 0.02, b - 0.02);
        ctx!.arc(0, 0, rotorInner, b - 0.03, a + 0.03, true);
        ctx!.closePath();
        ctx!.fillStyle = i % 2 === 0 ? 'rgba(122,61,40,0.22)' : 'rgba(56,23,15,0.28)';
        ctx!.fill();
      }

      const ivory = ctx!.createRadialGradient(-rotorInner * 0.16, -rotorInner * 0.18, rotorInner * 0.08, 0, 0, rotorInner);
      ivory.addColorStop(0, '#faf2d7');
      ivory.addColorStop(0.55, '#e8ddb8');
      ivory.addColorStop(1, '#b8ab84');
      ctx!.beginPath();
      ctx!.arc(0, 0, rotorInner, 0, TWO_PI);
      ctx!.fillStyle = ivory;
      ctx!.fill();

      ctx!.beginPath();
      ctx!.arc(0, 0, rotorInner * 0.88, 0, TWO_PI);
      ctx!.strokeStyle = 'rgba(90, 72, 32, 0.38)';
      ctx!.lineWidth = 2;
      ctx!.stroke();
      ctx!.restore();
    }

    function drawDeflectors() {
      const deflectorR = R * 0.92;
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * TWO_PI;
        const x = cx + Math.cos(a) * deflectorR;
        const y = cy + Math.sin(a) * deflectorR;
        ctx!.save();
        ctx!.translate(x, y);
        ctx!.rotate(a + Math.PI / 2);
        ctx!.beginPath();
        ctx!.moveTo(0, -6);
        ctx!.lineTo(5, 0);
        ctx!.lineTo(0, 6);
        ctx!.lineTo(-5, 0);
        ctx!.closePath();
        ctx!.fillStyle = '#352200ff';
        ctx!.fill();
        ctx!.restore();
      }
    }

    function drawCentreBoss(wheelAngle: number) {
      const hubR = R * 0.082;

      // Dark metallic socket
      const socket = ctx!.createRadialGradient(cx - hubR * 0.2, cy - hubR * 0.2, hubR * 0.08, cx, cy, hubR * 1.28);
      socket.addColorStop(0, '#8c9298');
      socket.addColorStop(0.45, '#4f565f');
      socket.addColorStop(1, '#20242b');
      ctx!.beginPath();
      ctx!.arc(cx, cy, hubR * 1.28, 0, TWO_PI);
      ctx!.fillStyle = socket;
      ctx!.fill();

      // Gold ring around socket
      const ring = ctx!.createRadialGradient(cx, cy, hubR * 1.38, cx, cy, hubR * 1.62);
      ring.addColorStop(0, '#8b6b22');
      ring.addColorStop(0.45, '#d0ad4a');
      ring.addColorStop(1, '#6d5016');
      ctx!.beginPath();
      ctx!.arc(cx, cy, hubR * 1.62, 0, TWO_PI);
      ctx!.arc(cx, cy, hubR * 1.36, 0, TWO_PI, true);
      ctx!.fillStyle = ring;
      ctx!.fill();

      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(wheelAngle);
      for (let i = 0; i < 4; i += 1) {
        const a = i * (Math.PI / 2);
        ctx!.save();
        ctx!.rotate(a);

        const armGrad = ctx!.createLinearGradient(0, -7, 0, 7);
        armGrad.addColorStop(0, '#8e621d');
        armGrad.addColorStop(0.42, '#5e4010');
        armGrad.addColorStop(1, '#2a1a04');

        const armTip = R * 0.32;

        // Ornate long arm
        ctx!.beginPath();
        ctx!.moveTo(hubR * 0.92, -6);
        ctx!.quadraticCurveTo(R * 0.16, -11, armTip, -7);
        ctx!.lineTo(armTip + 1, 0);
        ctx!.lineTo(armTip, 7);
        ctx!.quadraticCurveTo(R * 0.16, 11, hubR * 0.92, 6);
        ctx!.closePath();
        ctx!.fillStyle = armGrad;
        ctx!.fill();

        // Arm finial (small bulb)
        const finialX = R * 0.35;
        const finial = ctx!.createRadialGradient(finialX - 2, -2, 1, finialX, 0, 8);
        finial.addColorStop(0, '#a37122');
        finial.addColorStop(0.5, '#6e4911');
        finial.addColorStop(1, '#3b2505');
        ctx!.beginPath();
        ctx!.arc(finialX, 0, 7, 0, TWO_PI);
        ctx!.fillStyle = finial;
        ctx!.fill();

        ctx!.restore();
      }

      // Center cap
      const cap = ctx!.createRadialGradient(-3, -3, 1, 0, 0, hubR * 0.86);
      cap.addColorStop(0, '#f8ebbf');
      cap.addColorStop(0.48, '#bf9b40');
      cap.addColorStop(1, '#6c5018');
      ctx!.beginPath();
      ctx!.arc(0, 0, hubR * 0.86, 0, TWO_PI);
      ctx!.fillStyle = cap;
      ctx!.fill();
      ctx!.restore();
    }

    function drawBallTrack() {
      // Subtle groove on the outer wooden band (no bright yellow circle)
      const trackOuter = R * 0.885;
      const trackInner = R * 0.868;
      const groove = ctx!.createRadialGradient(cx, cy, trackInner, cx, cy, trackOuter);
      groove.addColorStop(0, 'rgba(34,14,8,0.9)');
      groove.addColorStop(0.5, 'rgba(90,42,24,0.55)');
      groove.addColorStop(1, 'rgba(30,12,6,0.95)');
      ctx!.beginPath();
      ctx!.arc(cx, cy, trackOuter, 0, TWO_PI);
      ctx!.arc(cx, cy, trackInner, 0, TWO_PI, true);
      ctx!.fillStyle = groove;
      ctx!.fill();

      // Thin highlight seam (very low saturation)
      ctx!.beginPath();
      ctx!.arc(cx, cy, (trackOuter + trackInner) / 2, 0, TWO_PI);
      ctx!.strokeStyle = 'rgba(185,140,80,0.15)';
      ctx!.lineWidth = Math.max(1, R * 0.002);
      ctx!.stroke();
    }

    function drawBall(ballAngle: number, ballRadius: number, ballZ: number) {
      // Realistic ball path:
      // - starts riding the OUTER wooden/metal track
      // - then drops inward into the pocket ring
      //
      // The CSS rotates the entire canvas, so we no longer apply perspective squash here.
      // Start on the OUTER wooden band groove; drop into the inner pocket ring.
      // pocketMid is aligned with where pocket labels are drawn so the ball
      // visually "locks" onto one value (not between two).
      const trackMid = R * 0.885;
      const pocketMid = R * 0.821;
      const t = Math.min(
        1,
        Math.max(0, (ballRadius - BALL_ORBIT_END) / (BALL_ORBIT_START - BALL_ORBIT_END))
      ); // 0 (dropped) … 1 (outer track)
      const orbitR = pocketMid + t * (trackMid - pocketMid);

      const yScale = 1; // perspective squash handled by CSS rotateX
      const bx = cx + Math.cos(ballAngle) * orbitR;
      const by = cy + Math.sin(ballAngle) * orbitR * yScale - Math.abs(ballZ) * 0.55;
      const br = R * 0.032;

      // Shadow
      ctx!.beginPath();
      ctx!.ellipse(bx + 2, by + 4, br * 1.25, br * 0.62 * yScale, 0, 0, TWO_PI);
      ctx!.fillStyle = 'rgba(0,0,0,0.4)';
      ctx!.fill();

      // Ball body
      const bgrad = ctx!.createRadialGradient(bx - br * 0.35, by - br * 0.35, br * 0.05, bx, by, br);
      bgrad.addColorStop(0, '#ffffff');
      bgrad.addColorStop(0.4, '#e8e0d0');
      bgrad.addColorStop(1, '#a09070');
      ctx!.beginPath();
      ctx!.arc(bx, by, br, 0, TWO_PI);
      ctx!.fillStyle = bgrad;
      ctx!.fill();

      // Specular highlight
      ctx!.beginPath();
      ctx!.arc(bx - br * 0.3, by - br * 0.3, br * 0.22, 0, TWO_PI);
      ctx!.fillStyle = 'rgba(255,255,255,0.85)';
      ctx!.fill();
    }

    function drawGlossOverlay() {
      const ggrad = ctx!.createRadialGradient(cx, cy - R * 0.2, R * 0.1, cx, cy, R);
      ggrad.addColorStop(0, 'rgba(255,255,200,0.06)');
      ggrad.addColorStop(0.5, 'rgba(255,255,200,0.02)');
      ggrad.addColorStop(1, 'rgba(0,0,0,0.18)');
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, TWO_PI);
      ctx!.fillStyle = ggrad;
      ctx!.fill();
    }

    // ── Animation loop ───────────────────────────────────────────────────────
    function animate(now: number) {
      const s = stateRef.current;
      const { pocketOrder, SECTOR_ANGLE, onSpinComplete } = latestProps.current;
      ctx!.clearRect(0, 0, S, S);

      if (s.spinning) {
        const elapsed = now - s.spinStartTime;
        const t = Math.min(elapsed / SPIN_DURATION, 1);

        // Wheel decelerates
        s.wheelAngle = s.startWheelAngle + (s.targetAngle - s.startWheelAngle) * easeOutQuad(t);

        // Ball counter-spins, decelerates exact match
        s.ballAngle = s.startBallAngle + (s.targetBallAngle - s.startBallAngle) * easeOutQuad(t);

        // Ball spirals inward after BALL_SETTLE_AT
        if (t > BALL_SETTLE_AT) {
          const dropT = (t - BALL_SETTLE_AT) / (1 - BALL_SETTLE_AT);
          s.ballRadius = BALL_ORBIT_START - (BALL_ORBIT_START - BALL_ORBIT_END) * easeOutCubic(dropT);

          if (dropT < 0.6) {
            s.wobble = Math.sin(dropT * 40) * (1 - dropT) * 8;
            s.ballZ = Math.abs(Math.sin(dropT * 25)) * (1 - dropT) * 12;
          } else {
            s.wobble = 0;
            s.ballZ = 0;
          }
        } else {
          s.ballRadius = BALL_ORBIT_START;
        }

        // ── FIX 1: smoothly interpolate to final exact angle to avoid teleports ──
        // ── FIX 2: freeze wheel & ball completely once settled   ──
        if (t >= 1) {
          s.spinning = false;
          s.ballSettled = true;
          // Hard snap to exact final values to avoid ending "between pockets".
          s.wheelAngle = s.targetAngle;
          s.ballAngle = s.targetBallAngle;
          s.ballRadius = BALL_ORBIT_END;
          s.ballZ = 0;
          if (onSpinComplete) onSpinComplete();
        }

      } else {
        // ── FIX 3: only drift when nothing has settled yet ──
        // Once the ball is in a pocket, freeze everything so the
        // win message can show over a still wheel.
        if (!s.ballSettled) {
          s.wheelAngle += 0.0008;
          s.ballAngle -= 0.0005;
        }
        // ballSettled === true → wheel and ball stay exactly where they are
      }

      // ── Draw ──
      drawOuterBowl();
      drawDeflectors();
      drawSectors(s.wheelAngle, pocketOrder, SECTOR_ANGLE);
      drawWoodRotor(s.wheelAngle);
      drawBallTrack();
      drawBall(s.ballAngle, s.ballRadius, s.ballZ);
      drawCentreBoss(s.wheelAngle);
      drawGlossOverlay();

      s.rafId = requestAnimationFrame(animate);
    }

    stateRef.current.rafId = requestAnimationFrame(animate);
    return () => {
      if (stateRef.current.rafId) cancelAnimationFrame(stateRef.current.rafId);
    };
  }, [size]);

  return (
    <div
      className="relative flex-shrink-0 flex items-center justify-center w-full aspect-square"
      style={{ maxWidth: size, perspective: '1300px' }}
    >
      <div
        className="absolute inset-[3%] rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #935a2d 0%, #5f351b 45%, #2c140a 100%)',
          transform: 'rotateX(80deg) translateZ(-12px)',
          transformStyle: 'preserve-3d',
          filter: 'blur(0.2px)',
          boxShadow: '0 28px 28px rgba(0,0,0,0.48)',
        }}
      />
      <div
        className="w-full h-full"
        style={{
          transform: 'rotateX(14deg) translateZ(8px)',
          transformStyle: 'preserve-3d',
          filter: 'drop-shadow(0 24px 18px rgba(0,0,0,0.5))',
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{
            borderRadius: '50%',
            boxShadow: '0 0 60px rgba(0,0,0,0.8), 0 0 20px rgba(180,140,0,0.3)',
            display: 'block',
          }}
        />
      </div>
      <div
        className="absolute top-[5%] left-1/2 -translate-x-1/2 z-10"
        style={{
          width: 0,
          height: 0,
          borderLeft: '9px solid transparent',
          borderRight: '9px solid transparent',
          borderTop: '20px solid #f8e39a',
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.6))',
        }}
      />
    </div>
  );
}