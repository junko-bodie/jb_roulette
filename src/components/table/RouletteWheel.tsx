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
import { soundEngine } from '@/lib/audioEngine';

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
    // audio
    lastPocketIndex: -1,
    lastTickTime: 0,
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
    s.lastPocketIndex = -1;
    s.lastTickTime = 0;
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
      const wallInnerR = R * 0.86;

      // Dark solid base under the wheel
      const baseGrad = ctx!.createRadialGradient(cx, cy, outerR * 0.7, cx, cy, outerR + 10);
      baseGrad.addColorStop(0, '#000000');
      baseGrad.addColorStop(1, 'rgba(0,0,0,0.8)');
      ctx!.beginPath();
      ctx!.arc(cx, cy, outerR + 2, 0, TWO_PI);
      ctx!.fillStyle = baseGrad;
      ctx!.fill();

      // Outer Thick Mahogany Rim
      const rimGrad = ctx!.createRadialGradient(cx - outerR * 0.2, cy - outerR * 0.2, outerR * 0.1, cx, cy, outerR);
      rimGrad.addColorStop(0, '#662615');
      rimGrad.addColorStop(0.4, '#48170b');
      rimGrad.addColorStop(0.8, '#2a0a03');
      rimGrad.addColorStop(1, '#150300');
      ctx!.beginPath();
      ctx!.arc(cx, cy, outerR, 0, TWO_PI);
      ctx!.arc(cx, cy, wallR, 0, TWO_PI, true);
      ctx!.fillStyle = rimGrad;
      ctx!.fill();

      // Gleaming Wood Track (where the ball actually spins)
      const trackGrad = ctx!.createRadialGradient(cx, cy, wallInnerR, cx, cy, wallR);
      trackGrad.addColorStop(0, '#1c0c08'); // deep shadow at the bottom
      trackGrad.addColorStop(0.4, '#4a2215'); // mid wood
      trackGrad.addColorStop(0.8, '#6b3320'); // hit by light at the top
      trackGrad.addColorStop(1, '#2f150d'); // outer shadow
      ctx!.beginPath();
      ctx!.arc(cx, cy, wallR, 0, TWO_PI);
      ctx!.arc(cx, cy, wallInnerR, 0, TWO_PI, true);
      ctx!.fillStyle = trackGrad;
      ctx!.fill();

      // Inner metallic lip of the static track
      ctx!.beginPath();
      ctx!.arc(cx, cy, wallInnerR, 0, TWO_PI);
      ctx!.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx!.lineWidth = 2;
      ctx!.stroke();
    }

    function drawSectors(wheelAngle: number, currentPockets: number[], currentSectorAngle: number) {
      const innerR = R * 0.65;
      const outerR = R * 0.85;

      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(wheelAngle);

      const sectors = currentPockets.map((num, i) => {
        const startA = i * currentSectorAngle - Math.PI / 2;
        const endA = startA + currentSectorAngle;

        let colorHex = '#1a1a1a'; // deep black
        const colorName = getNumberColor(num);
        if (colorName === 'red') colorHex = '#bd222e'; // rich ruby red
        if (colorName === 'green') colorHex = '#197a3d'; // metallic emerald

        // Add radial dropoff to pockets so they look concave
        const pocketGrad = ctx!.createRadialGradient(0, 0, innerR, 0, 0, outerR);
        pocketGrad.addColorStop(0, colorHex);

        // Darken the outer edge to simulate depth
        let outerDark = '#090909';
        if (colorName === 'red') outerDark = '#6e1017';
        if (colorName === 'green') outerDark = '#0e4a23';
        pocketGrad.addColorStop(1, outerDark);

        return { num, startA, endA, grad: pocketGrad };
      });

      sectors.forEach(({ num, startA, endA, grad }) => {
        // Draw Sector Background
        ctx!.beginPath();
        ctx!.arc(0, 0, outerR, startA, endA);
        ctx!.arc(0, 0, innerR, endA, startA, true);
        ctx!.closePath();
        ctx!.fillStyle = grad;
        ctx!.fill();

        // Draw metallic dividers (Frets)
        ctx!.beginPath();
        ctx!.arc(0, 0, outerR, startA, endA);
        ctx!.arc(0, 0, innerR, endA, startA, true);
        ctx!.closePath();
        ctx!.strokeStyle = '#d4af37'; // Gold frets
        ctx!.lineWidth = 1.8;
        ctx!.stroke();

        // Overlap shadow for 3D depth on the fret
        ctx!.beginPath();
        ctx!.arc(0, 0, outerR, startA, endA);
        ctx!.arc(0, 0, innerR, endA, startA, true);
        ctx!.closePath();
        ctx!.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx!.lineWidth = 0.5;
        ctx!.stroke();

        // Draw numbers
        const midA = (startA + endA) / 2;
        const labelR = outerR * 0.94;
        const lx = Math.cos(midA) * labelR;
        const ly = Math.sin(midA) * labelR;

        ctx!.save();
        ctx!.translate(lx, ly);
        ctx!.rotate(midA + Math.PI / 2);
        ctx!.fillStyle = '#ffffff';
        ctx!.font = `bold ${R * 0.08}px 'Georgia', serif`;
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'middle';
        ctx!.shadowColor = 'rgba(0,0,0,0.9)';
        ctx!.shadowBlur = 4;
        ctx!.fillText(getDisplayNumber(num), 0, 0);
        ctx!.restore();
      });

      // Gold Inner and Outer Rings around the pockets
      ctx!.beginPath();
      ctx!.arc(0, 0, outerR, 0, TWO_PI);
      ctx!.strokeStyle = '#b8942b';
      ctx!.lineWidth = 3;
      ctx!.stroke();

      ctx!.beginPath();
      ctx!.arc(0, 0, innerR, 0, TWO_PI);
      ctx!.strokeStyle = '#b8942b';
      ctx!.lineWidth = 3;
      ctx!.stroke();

      ctx!.restore();
    }

    function drawWoodRotor(wheelAngle: number) {
      const rotorOuter = R * 0.64;
      const rotorInner = R * 0.38; // Increased inner size to match the huge gold dome in reference

      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(wheelAngle);

      // Deep rich cherry wood for the cone
      const wood = ctx!.createRadialGradient(-rotorOuter * 0.2, -rotorOuter * 0.2, rotorOuter * 0.1, 0, 0, rotorOuter);
      wood.addColorStop(0, '#5b2416');
      wood.addColorStop(0.5, '#3b140b');
      wood.addColorStop(1, '#1c0703');

      ctx!.beginPath();
      ctx!.arc(0, 0, rotorOuter, 0, TWO_PI);
      ctx!.fillStyle = wood;
      ctx!.fill();

      // Shiny pie-slice highlights to make the cone look faceted/3D and polished
      for (let i = 0; i < 16; i += 1) {
        const a = (i / 16) * TWO_PI;
        const b = ((i + 1) / 16) * TWO_PI;
        ctx!.beginPath();
        ctx!.arc(0, 0, rotorOuter, a, b);
        ctx!.arc(0, 0, rotorInner, b, a, true);
        ctx!.closePath();

        ctx!.fillStyle = i % 2 === 0 ? 'rgba(255,150,100,0.03)' : 'rgba(0,0,0,0.15)';
        ctx!.fill();
      }

      // Large Gold/Brass ring circling the center dome
      const brass = ctx!.createRadialGradient(-rotorInner * 0.2, -rotorInner * 0.2, rotorInner * 0.1, 0, 0, rotorInner);
      brass.addColorStop(0, '#f9df9f');
      brass.addColorStop(0.3, '#d4af37');
      brass.addColorStop(0.7, '#8b6b22');
      brass.addColorStop(1, '#4a360c');

      ctx!.beginPath();
      ctx!.arc(0, 0, rotorInner, 0, TWO_PI);
      ctx!.fillStyle = brass;
      ctx!.fill();

      // Inner shadow to give the brass ring depth
      ctx!.beginPath();
      ctx!.arc(0, 0, rotorInner, 0, TWO_PI);
      ctx!.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx!.lineWidth = 4;
      ctx!.stroke();

      ctx!.restore();
    }

    function drawDeflectors() {
      const deflectorR = R * 0.895; // Positioned right in the track
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * TWO_PI;
        const x = cx + Math.cos(a) * deflectorR;
        const y = cy + Math.sin(a) * deflectorR;

        ctx!.save();
        ctx!.translate(x, y);
        ctx!.rotate(a + Math.PI / 2);

        // Metallic silver deflectors highly polished
        const defGrad = ctx!.createLinearGradient(-4, -6, 4, 6);
        defGrad.addColorStop(0, '#ffffff');
      ctx!.fillStyle = defGrad;
        ctx!.fill();
        ctx!.restore();
      }
    }

    function drawCentreBoss(wheelAngle: number) {
      // Dark Base Socket
      const hubR = R * 0.18;
      const socket = ctx!.createRadialGradient(-hubR * 0.2, -hubR * 0.2, hubR * 0.1, 0, 0, hubR);
      socket.addColorStop(0, '#4a5568'); // light greyish blue hit
      socket.addColorStop(0.5, '#2d3748');
      socket.addColorStop(1, '#1a202c'); // very dark rim

      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(wheelAngle);

      ctx!.beginPath();
      ctx!.arc(0, 0, hubR, 0, TWO_PI);
      ctx!.fillStyle = socket;
      ctx!.fill();
      
      // Drop inner shadow for socket
      ctx!.beginPath();
      ctx!.arc(0, 0, hubR, 0, TWO_PI);
      ctx!.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx!.lineWidth = 3;
      ctx!.stroke();

      // The 4 Golden Handles (Bowling Pin Shaped)
      const armStart = R * 0.10; // Start inside the socket, past the center cap
      const armEnd = R * 0.36;   // End exactly on the gold outer disc
      const tipRadius = R * 0.045; // Golden sphere tip size

      for (let i = 0; i < 4; i++) {
        ctx!.save();
        ctx!.rotate(i * (Math.PI / 2));

        // Horizontal gradient from top to bottom of the bat to look spherical
        const handleGrad = ctx!.createLinearGradient(0, -R*0.06, 0, R*0.06);
        handleGrad.addColorStop(0, '#75541c');
        handleGrad.addColorStop(0.2, '#d4af37'); // bright top hit
        handleGrad.addColorStop(0.5, '#fef1a6'); // reflection stripe down the middle
        handleGrad.addColorStop(0.8, '#d4af37'); // darker underside
        handleGrad.addColorStop(1, '#3b2605'); // deep shadow edge

        // Draw the handle with bezier curves for that iconic 'taper to flare' bowling-pin look
        ctx!.beginPath();
        // Thin base
        ctx!.moveTo(armStart, -R * 0.02);
        
        // Smooth curve flaring gradually outwards
        ctx!.bezierCurveTo(
          armStart + (armEnd - armStart) * 0.3, -R * 0.02, 
          armStart + (armEnd - armStart) * 0.6, -R * 0.05, 
          armEnd, -R * 0.04
        );
        
        // Flat outer edge
        ctx!.lineTo(armEnd, R * 0.04);

        // Smooth curve tapering back inwards
        ctx!.bezierCurveTo(
          armStart + (armEnd - armStart) * 0.6, R * 0.05, 
          armStart + (armEnd - armStart) * 0.3, R * 0.02, 
          armStart, R * 0.02
        );
        ctx!.closePath();

        // Very dark heavy shadow underneath
        ctx!.shadowColor = 'rgba(0,0,0,0.6)';
        ctx!.shadowBlur = 8;
        ctx!.shadowOffsetX = 3;
        ctx!.shadowOffsetY = 5;

        ctx!.fillStyle = handleGrad;
        ctx!.fill();
        ctx!.shadowColor = 'transparent'; // Reset

        // Golden Sphere Tip resting exactly at the end
        const tipX = armEnd + R * 0.02; // Overlaps the flared end slightly
        const tipGrad = ctx!.createRadialGradient(tipX - tipRadius * 0.3, -tipRadius * 0.3, tipRadius * 0.1, tipX, 0, tipRadius);
        tipGrad.addColorStop(0, '#ffffff'); // pure glare
        tipGrad.addColorStop(0.3, '#fef1a6');
        tipGrad.addColorStop(0.7, '#ccaa42');
        tipGrad.addColorStop(1, '#4a330a');

        ctx!.beginPath();
        ctx!.arc(tipX, 0, tipRadius, 0, TWO_PI);
        ctx!.fillStyle = tipGrad;
        ctx!.fill();

        ctx!.restore();
      }

      // Center Dark Cap
      const capR = R * 0.09;
      const capGrad = ctx!.createRadialGradient(-capR * 0.2, -capR * 0.2, capR * 0.1, 0, 0, capR);
      capGrad.addColorStop(0, '#3f4552');
      capGrad.addColorStop(0.5, '#2d333e');
      capGrad.addColorStop(1, '#171a21');

      ctx!.beginPath();
      ctx!.arc(0, 0, capR, 0, TWO_PI);
      ctx!.fillStyle = capGrad;
      ctx!.fill();

      // Sharp shadow rim around center cap
      ctx!.beginPath();
      ctx!.arc(0, 0, capR, 0, TWO_PI);
      ctx!.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx!.lineWidth = 2;
      ctx!.stroke();

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

        const prevRelative = ((s.ballAngle - s.wheelAngle) % TWO_PI + TWO_PI) % TWO_PI;
        const prevIdx = Math.floor(prevRelative / SECTOR_ANGLE);

        // Wheel decelerates
        s.wheelAngle = s.startWheelAngle + (s.targetAngle - s.startWheelAngle) * easeOutQuad(t);

        // Ball counter-spins, decelerates exact match
        s.ballAngle = s.startBallAngle + (s.targetBallAngle - s.startBallAngle) * easeOutQuad(t);

        // Play tick sound when passing pocket dividers (frets)
        const newRelative = ((s.ballAngle - s.wheelAngle) % TWO_PI + TWO_PI) % TWO_PI;
        const newIdx = Math.floor(newRelative / SECTOR_ANGLE);

        // Only play tick if it changed pocket and t > 0.05 so it doesn't instantly spam
        if (prevIdx !== newIdx && t > 0.02 && t < 0.98) {
          if (now - s.lastTickTime > 40) { // Throttle to max ~25 ticks per second
            soundEngine?.playWheelTick();
            s.lastTickTime = now;
          }
        }

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