import React, { useCallback, useEffect, useRef, memo } from 'react';
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
  tournamentMode?: boolean;
}

const TWO_PI = Math.PI * 2;

// ─── Physics constants ────────────────────────────────────────────────────────
const BALL_ORBIT_START = 0.88;  // fraction of wheel radius
const BALL_ORBIT_END = 0.50;  // fraction where ball drops deep into pocket
const SPIN_DURATION = 4000;  // ms total spin
const BALL_SETTLE_AT = 0.68;  // fraction into spin when ball starts dropping (earlier start for more drama)

function easeOutQuad(t: number) { return 1 - (1 - t) * (1 - t); }
function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

// ─── Main Component ───────────────────────────────────────────────────────────
const RouletteWheel = memo(function RouletteWheel({
  wheelType,
  spinResult,
  isSpinning,
  onSpinComplete,
  size = 480,
  tournamentMode = false
}: RouletteWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
    lastTriggeredResult: null as string | null,
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

    soundEngine?.startSpinSound();
  }, []);

  useEffect(() => {
    const resultKey = spinResult ? `${spinResult.id}` : null;
    if (isSpinning && spinResult && stateRef.current.lastTriggeredResult !== resultKey) {
      stateRef.current.lastTriggeredResult = resultKey;
      triggerSpin(spinResult.number);
    }
  }, [isSpinning, spinResult, triggerSpin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Performance optimization
    if (!ctx) return;

    const DPR = window.devicePixelRatio || 1;
    const S = size;
    const cx = S / 2;
    const cy = S / 2;
    const R = S * 0.44;

    canvas.width = S * DPR;
    canvas.height = S * DPR;
    canvas.style.width = S + 'px';
    canvas.style.height = S + 'px';
    ctx.scale(DPR, DPR);

    // ── Pre-render static layers ──
    const cacheCanvas = document.createElement('canvas');
    cacheCanvas.width = S * DPR;
    cacheCanvas.height = S * DPR;
    const cacheCtx = cacheCanvas.getContext('2d');
    if (cacheCtx) {
      cacheCtx.scale(DPR, DPR);
      
      // Draw static background (Bowl, track, etc.)
      const outerR = R * 1.02;
      const wallR = R * 0.94;
      const wallInnerR = R * 0.86;

      // Dark solid base
      const baseGrad = cacheCtx.createRadialGradient(cx, cy, outerR * 0.7, cx, cy, outerR + 10);
      baseGrad.addColorStop(0, '#000000');
      baseGrad.addColorStop(1, 'rgba(0,0,0,0.8)');
      cacheCtx.beginPath();
      cacheCtx.arc(cx, cy, outerR + 2, 0, TWO_PI);
      cacheCtx.fillStyle = baseGrad;
      cacheCtx.fill();

      // Outer Thick Mahogany Rim
      const rimGrad = cacheCtx.createRadialGradient(cx - outerR * 0.2, cy - outerR * 0.2, outerR * 0.1, cx, cy, outerR);
      rimGrad.addColorStop(0, '#662615');
      rimGrad.addColorStop(0.4, '#48170b');
      rimGrad.addColorStop(0.8, '#2a0a03');
      rimGrad.addColorStop(1, '#150300');
      cacheCtx.beginPath();
      cacheCtx.arc(cx, cy, outerR, 0, TWO_PI);
      cacheCtx.arc(cx, cy, wallR, 0, TWO_PI, true);
      cacheCtx.fillStyle = rimGrad;
      cacheCtx.fill();

      // Gleaming Wood Track
      const trackGrad = cacheCtx.createRadialGradient(cx, cy, wallInnerR, cx, cy, wallR);
      trackGrad.addColorStop(0, '#1c0c08');
      trackGrad.addColorStop(0.4, '#4a2215');
      trackGrad.addColorStop(0.8, '#6b3320');
      trackGrad.addColorStop(1, '#2f150d');
      cacheCtx.beginPath();
      cacheCtx.arc(cx, cy, wallR, 0, TWO_PI);
      cacheCtx.arc(cx, cy, wallInnerR, 0, TWO_PI, true);
      cacheCtx.fillStyle = trackGrad;
      cacheCtx.fill();

      // Metallic lip
      cacheCtx.beginPath();
      cacheCtx.arc(cx, cy, wallInnerR, 0, TWO_PI);
      cacheCtx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      cacheCtx.lineWidth = 2;
      cacheCtx.stroke();

      // Draw deflectors
      const deflectorR = R * 0.895;
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * TWO_PI;
        const x = cx + Math.cos(a) * deflectorR;
        const y = cy + Math.sin(a) * deflectorR;
        cacheCtx.save();
        cacheCtx.translate(x, y);
        cacheCtx.rotate(a + Math.PI / 2);
        const defGrad = cacheCtx.createLinearGradient(-4, -6, 4, 6);
        defGrad.addColorStop(0, '#ffffff');
        defGrad.addColorStop(0.4, '#a0a0a0');
        defGrad.addColorStop(1, '#606060');
        cacheCtx.beginPath();
        cacheCtx.rect(-3, -5, 6, 10);
        cacheCtx.fillStyle = defGrad;
        cacheCtx.fill();
        cacheCtx.restore();
      }

      // Ball track groove
      const trackOuter = R * 0.885;
      const trackInner = R * 0.868;
      const groove = cacheCtx.createRadialGradient(cx, cy, trackInner, cx, cy, trackOuter);
      groove.addColorStop(0, 'rgba(34,14,8,0.9)');
      groove.addColorStop(0.5, 'rgba(90,42,24,0.55)');
      groove.addColorStop(1, 'rgba(30,12,6,0.95)');
      cacheCtx.beginPath();
      cacheCtx.arc(cx, cy, trackOuter, 0, TWO_PI);
      cacheCtx.arc(cx, cy, trackInner, 0, TWO_PI, true);
      cacheCtx.fillStyle = groove;
      cacheCtx.fill();
    }
    cacheCanvasRef.current = cacheCanvas;

    function drawSectors(wheelAngle: number, currentPockets: number[], currentSectorAngle: number) {
      const s = stateRef.current;
      const innerR = R * 0.65;
      const outerR = R * 0.85;
      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(wheelAngle);

      currentPockets.forEach((num, i) => {
        const startA = i * currentSectorAngle - Math.PI / 2;
        const endA = startA + currentSectorAngle;
        let colorHex = '#1a1a1a';
        const colorName = getNumberColor(num);
        if (colorName === 'red') colorHex = '#bd222e';
        if (colorName === 'green') colorHex = '#197a3d';
        const pocketGrad = ctx!.createRadialGradient(0, 0, innerR, 0, 0, outerR);
        pocketGrad.addColorStop(0, colorHex);
        let outerDark = '#090909';
        if (colorName === 'red') outerDark = '#6e1017';
        if (colorName === 'green') outerDark = '#0e4a23';
        pocketGrad.addColorStop(1, outerDark);
        ctx!.beginPath();
        ctx!.arc(0, 0, outerR, startA, endA);
        ctx!.arc(0, 0, innerR, endA, startA, true);
        ctx!.closePath();
        ctx!.fillStyle = pocketGrad;
        ctx!.fill();
        ctx!.beginPath();
        ctx!.arc(0, 0, outerR, startA, endA);
        ctx!.arc(0, 0, innerR, endA, startA, true);
        ctx!.closePath();
        ctx!.strokeStyle = '#d4af37';
        ctx!.lineWidth = 1.8;
        ctx!.stroke();
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
        const isFastSpin = s.spinning && (performance.now() - s.spinStartTime) / SPIN_DURATION < 0.9;
        
        if (!isFastSpin) {
          ctx!.shadowColor = 'rgba(0,0,0,0.9)';
          ctx!.shadowBlur = 4;
        }
        ctx!.fillText(getDisplayNumber(num), 0, 0);
        if (!isFastSpin) {
          ctx!.shadowColor = 'transparent';
          ctx!.shadowBlur = 0;
        }
        ctx!.restore();
      });
      ctx!.beginPath(); ctx!.arc(0, 0, outerR, 0, TWO_PI); ctx!.strokeStyle = '#b8942b'; ctx!.lineWidth = 3; ctx!.stroke();
      ctx!.beginPath(); ctx!.arc(0, 0, innerR, 0, TWO_PI); ctx!.strokeStyle = '#b8942b'; ctx!.lineWidth = 3; ctx!.stroke();
      ctx!.restore();
    }

    function drawWoodRotor(wheelAngle: number) {
      const rotorOuter = R * 0.64;
      const rotorInner = R * 0.38;
      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(wheelAngle);
      const wood = ctx!.createRadialGradient(-rotorOuter * 0.2, -rotorOuter * 0.2, rotorOuter * 0.1, 0, 0, rotorOuter);
      wood.addColorStop(0, '#5b2416');
      wood.addColorStop(0.5, '#3b140b');
      wood.addColorStop(1, '#1c0703');
      ctx!.beginPath(); ctx!.arc(0, 0, rotorOuter, 0, TWO_PI); ctx!.fillStyle = wood; ctx!.fill();
      for (let i = 0; i < 16; i += 1) {
        const a = (i / 16) * TWO_PI; const b = ((i + 1) / 16) * TWO_PI;
        ctx!.beginPath(); ctx!.arc(0, 0, rotorOuter, a, b); ctx!.arc(0, 0, rotorInner, b, a, true); ctx!.closePath();
        ctx!.fillStyle = i % 2 === 0 ? 'rgba(255,150,100,0.03)' : 'rgba(0,0,0,0.15)'; ctx!.fill();
      }
      const brass = ctx!.createRadialGradient(-rotorInner * 0.2, -rotorInner * 0.2, rotorInner * 0.1, 0, 0, rotorInner);
      brass.addColorStop(0, '#f9df9f'); brass.addColorStop(0.3, '#d4af37'); brass.addColorStop(0.7, '#8b6b22'); brass.addColorStop(1, '#4a360c');
      ctx!.beginPath(); ctx!.arc(0, 0, rotorInner, 0, TWO_PI); ctx!.fillStyle = brass; ctx!.fill();
      ctx!.beginPath(); ctx!.arc(0, 0, rotorInner, 0, TWO_PI); ctx!.strokeStyle = 'rgba(0,0,0,0.6)'; ctx!.lineWidth = 4; ctx!.stroke();
      ctx!.restore();
    }

    function drawCentreBoss(wheelAngle: number) {
      const s = stateRef.current;
      const hubR = R * 0.18;
      const socket = ctx!.createRadialGradient(-hubR * 0.2, -hubR * 0.2, hubR * 0.1, 0, 0, hubR);
      socket.addColorStop(0, '#4a5568'); socket.addColorStop(0.5, '#2d3748'); socket.addColorStop(1, '#1a202c');
      ctx!.save(); ctx!.translate(cx, cy); ctx!.rotate(wheelAngle);
      ctx!.beginPath(); ctx!.arc(0, 0, hubR, 0, TWO_PI); ctx!.fillStyle = socket; ctx!.fill();
      ctx!.beginPath(); ctx!.arc(0, 0, hubR, 0, TWO_PI); ctx!.strokeStyle = 'rgba(0,0,0,0.8)'; ctx!.lineWidth = 3; ctx!.stroke();
      const armStart = R * 0.10; const armEnd = R * 0.36; const tipRadius = R * 0.045;
      for (let i = 0; i < 4; i++) {
        ctx!.save(); ctx!.rotate(i * (Math.PI / 2));
        const handleGrad = ctx!.createLinearGradient(0, -R * 0.06, 0, R * 0.06);
        handleGrad.addColorStop(0, '#75541c'); handleGrad.addColorStop(0.2, '#d4af37'); handleGrad.addColorStop(0.5, '#fef1a6'); handleGrad.addColorStop(0.8, '#d4af37'); handleGrad.addColorStop(1, '#3b2605');
        ctx!.beginPath(); ctx!.moveTo(armStart, -R * 0.02); ctx!.bezierCurveTo(armStart + (armEnd - armStart) * 0.3, -R * 0.02, armStart + (armEnd - armStart) * 0.6, -R * 0.05, armEnd, -R * 0.04);
        ctx!.lineTo(armEnd, R * 0.04); ctx!.bezierCurveTo(armStart + (armEnd - armStart) * 0.6, R * 0.05, armStart + (armEnd - armStart) * 0.3, R * 0.02, armStart, R * 0.02);
        const isFastSpin = s.spinning && (performance.now() - s.spinStartTime) / SPIN_DURATION < 0.9;

        if (!isFastSpin) {
          ctx!.shadowColor = 'rgba(0,0,0,0.6)';
          ctx!.shadowBlur = 8;
          ctx!.shadowOffsetX = 3;
          ctx!.shadowOffsetY = 5;
        }
        ctx!.fillStyle = handleGrad;
        ctx!.fill();
        if (!isFastSpin) {
          ctx!.shadowColor = 'transparent';
          ctx!.shadowBlur = 0;
          ctx!.shadowOffsetX = 0;
          ctx!.shadowOffsetY = 0;
        }
        const tipX = armEnd + R * 0.02; const tipGrad = ctx!.createRadialGradient(tipX - tipRadius * 0.3, -tipRadius * 0.3, tipRadius * 0.1, tipX, 0, tipRadius);
        tipGrad.addColorStop(0, '#ffffff'); tipGrad.addColorStop(0.3, '#fef1a6'); tipGrad.addColorStop(0.7, '#ccaa42'); tipGrad.addColorStop(1, '#4a330a');
        ctx!.beginPath(); ctx!.arc(tipX, 0, tipRadius, 0, TWO_PI); ctx!.fillStyle = tipGrad; ctx!.fill();
        ctx!.restore();
      }
      const capR = R * 0.09; const capGrad = ctx!.createRadialGradient(-capR * 0.2, -capR * 0.2, capR * 0.1, 0, 0, capR);
      capGrad.addColorStop(0, '#3f4552'); capGrad.addColorStop(0.5, '#2d333e'); capGrad.addColorStop(1, '#171a21');
      ctx!.beginPath(); ctx!.arc(0, 0, capR, 0, TWO_PI); ctx!.fillStyle = capGrad; ctx!.fill();
      ctx!.beginPath(); ctx!.arc(0, 0, capR, 0, TWO_PI); ctx!.strokeStyle = 'rgba(0,0,0,0.8)'; ctx!.lineWidth = 2; ctx!.stroke();
      ctx!.restore();
    }

    function drawBall(ballAngle: number, ballRadius: number, ballZ: number) {
      const trackMid = R * 0.885;
      const pocketBottom = R * 0.68;
      const t = Math.min(1, Math.max(0, (ballRadius - BALL_ORBIT_END) / (BALL_ORBIT_START - BALL_ORBIT_END)));
      const orbitR = pocketBottom + t * (trackMid - pocketBottom);
      const bx = cx + Math.cos(ballAngle) * orbitR;
      const by = cy + Math.sin(ballAngle) * orbitR - Math.abs(ballZ) * 0.55;
      const br = R * 0.032;
      ctx!.beginPath(); ctx!.ellipse(bx + 2, by + 4, br * 1.25, br * 0.62, 0, 0, TWO_PI); ctx!.fillStyle = 'rgba(0,0,0,0.4)'; ctx!.fill();
      const bgrad = ctx!.createRadialGradient(bx - br * 0.35, by - br * 0.35, br * 0.05, bx, by, br);
      bgrad.addColorStop(0, '#ffffff'); bgrad.addColorStop(0.4, '#e8e0d0'); bgrad.addColorStop(1, '#a09070');
      ctx!.beginPath(); ctx!.arc(bx, by, br, 0, TWO_PI); ctx!.fillStyle = bgrad; ctx!.fill();
      ctx!.beginPath(); ctx!.arc(bx - br * 0.3, by - br * 0.3, br * 0.22, 0, TWO_PI); ctx!.fillStyle = 'rgba(255,255,255,0.85)'; ctx!.fill();
    }

    function drawGlossOverlay() {
      const ggrad = ctx!.createRadialGradient(cx, cy - R * 0.2, R * 0.1, cx, cy, R);
      ggrad.addColorStop(0, 'rgba(255,255,200,0.06)'); ggrad.addColorStop(0.5, 'rgba(255,255,200,0.02)'); ggrad.addColorStop(1, 'rgba(0,0,0,0.18)');
      ctx!.beginPath(); ctx!.arc(cx, cy, R, 0, TWO_PI); ctx!.fillStyle = ggrad; ctx!.fill();
    }

    function animate(now: number) {
      const s = stateRef.current;
      const { pocketOrder, SECTOR_ANGLE, onSpinComplete } = latestProps.current;
      
      // Use the cached static layer
      if (cacheCanvasRef.current) {
        ctx!.drawImage(cacheCanvasRef.current, 0, 0, S, S);
      } else {
        ctx!.clearRect(0, 0, S, S);
      }

      if (s.spinning) {
        const elapsed = now - s.spinStartTime;
        const t = Math.min(elapsed / SPIN_DURATION, 1);
        const baseVol = 0.25 - (t * 0.2);
        const endFade = t > 0.96 ? (1 - t) / 0.04 : 1;
        const soundVol = Math.max(0, baseVol * endFade);
        const soundRate = 1.0 - (t * 0.5);
        soundEngine?.setSpinEffect(soundVol, soundRate);
        const prevRelative = ((s.ballAngle - s.wheelAngle) % TWO_PI + TWO_PI) % TWO_PI;
        const prevIdx = Math.floor(prevRelative / SECTOR_ANGLE);
        s.wheelAngle = s.startWheelAngle + (s.targetAngle - s.startWheelAngle) * easeOutQuad(t);
        s.ballAngle = s.startBallAngle + (s.targetBallAngle - s.startBallAngle) * easeOutQuad(t);
        const newRelative = ((s.ballAngle - s.wheelAngle) % TWO_PI + TWO_PI) % TWO_PI;
        const newIdx = Math.floor(newRelative / SECTOR_ANGLE);
        const tickThreshold = 40 + (t * 160);
        if (prevIdx !== newIdx && t > 0.02 && t < 0.94) {
          if (now - s.lastTickTime > tickThreshold) {
            soundEngine?.playWheelTick();
            s.lastTickTime = now;
          }
        }
        if (t > BALL_SETTLE_AT) {
          const dropT = (t - BALL_SETTLE_AT) / (1 - BALL_SETTLE_AT);
          const spiralT = easeOutCubic(dropT);
          s.ballRadius = BALL_ORBIT_START - (BALL_ORBIT_START - BALL_ORBIT_END) * spiralT;
          if (dropT < 0.85) {
            const bounceFreq = dropT * 18;
            const decay = Math.pow(1 - dropT * 0.9, 2.5);
            const bounceHeight = Math.abs(Math.sin(bounceFreq * Math.PI)) * decay * 28;
            s.ballZ = bounceHeight;
            if (bounceHeight > 2) {
              const wobbleAmount = bounceHeight * 0.003;
              s.ballRadius += Math.sin(bounceFreq * 3) * wobbleAmount;
            }
            if (bounceHeight < 2 && s.ballZ < 3) {
              s.wobble = (Math.random() - 0.5) * 0.01;
              s.ballAngle += s.wobble;
              if (now - s.lastTickTime > 150 && Math.random() > 0.6) {
                soundEngine?.playWheelTick();
                s.lastTickTime = now;
              }
            } else {
              s.wobble *= 0.85;
            }
          } else {
            const settleT = (dropT - 0.85) / 0.15;
            s.ballZ *= (1 - settleT);
            if (s.ballZ < 0.05) s.ballZ = 0;
            s.wobble = 0;
            s.ballRadius = BALL_ORBIT_END;
            const lockStrength = easeOutCubic(settleT) * 0.15;
            s.ballAngle = s.ballAngle * (1 - lockStrength) + s.targetBallAngle * lockStrength;
          }
        } else {
          s.ballRadius = BALL_ORBIT_START; s.ballZ = 0; s.wobble = 0;
        }
        if (t >= 1) {
          s.spinning = false; s.ballSettled = true;
          s.wheelAngle = s.targetAngle; s.ballAngle = s.targetBallAngle; s.ballRadius = BALL_ORBIT_END; s.ballZ = 0;
          soundEngine?.stopSpinSound();
          if (tournamentMode) {
            soundEngine?.resumeTourneyBackgroundMusic();
          } else {
            soundEngine?.playBackgroundMusic();
          }
          if (onSpinComplete) onSpinComplete();
        }
      } else {
        if (!s.ballSettled) {
          s.wheelAngle += 0.0008; s.ballAngle -= 0.0005;
        } else {
          s.wheelAngle += 0.0008; s.ballAngle += 0.0008;
        }
      }

      drawSectors(s.wheelAngle, pocketOrder, SECTOR_ANGLE);
      drawWoodRotor(s.wheelAngle);
      drawBall(s.ballAngle, s.ballRadius, s.ballZ);
      drawCentreBoss(s.wheelAngle);
      drawGlossOverlay();

      s.rafId = requestAnimationFrame(animate);
    }

    stateRef.current.rafId = requestAnimationFrame(animate);
    return () => {
      if (stateRef.current.rafId) cancelAnimationFrame(stateRef.current.rafId);
    };
  }, [size, pocketOrder, SECTOR_ANGLE]);

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
          willChange: 'transform',
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{
            borderRadius: '50%',
            boxShadow: '0 0 60px rgba(0,0,0,0.8), 0 0 20px rgba(180,140,0,0.3)',
            display: 'block',
            transform: 'translateZ(0)',
          }}
        />
      </div>
    </div>
  );
});

export default RouletteWheel;

