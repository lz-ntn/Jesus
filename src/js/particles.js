export function createParticle(ctx, canvas, config) {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  const size = config.size.min + Math.random() * (config.size.max - config.size.min);
  const angle = Math.random() * Math.PI * 2;
  const speed = config.speed * (0.5 + Math.random() * 0.5);
  
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size,
    baseSize: size,
    opacity: config.opacity.min + Math.random() * (config.opacity.max - config.opacity.min),
    pulsePhase: Math.random() * Math.PI * 2,
    pulseSpeed: 0.005 + Math.random() * 0.01,
    connections: [],
  };
}

export function updateParticle(p, canvas, config) {
  p.x += p.vx;
  p.y += p.vy;
  p.pulsePhase += p.pulseSpeed;
  p.size = p.baseSize * (0.8 + 0.2 * Math.sin(p.pulsePhase));
  
  if (p.x < -p.size || p.x > canvas.width + p.size || p.y < -p.size || p.y > canvas.height + p.size) {
    p.x = Math.random() * canvas.width;
    p.y = Math.random() * canvas.height;
    p.vx = (Math.random() - 0.5) * config.speed;
    p.vy = (Math.random() - 0.5) * config.speed;
  }
}

export function drawParticle(ctx, p, color) {
  const alpha = p.opacity * (0.6 + 0.4 * Math.sin(p.pulsePhase));
  ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
  ctx.beginPath();
  ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
  ctx.fill();
}

export function drawConnection(ctx, p1, p2, color, maxDistance) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < maxDistance) {
    const opacity = (1 - dist / maxDistance) * 0.15;
    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}

export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return { r, g, b };
}

export function getCssVariable(name) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || '#c9a227';
}