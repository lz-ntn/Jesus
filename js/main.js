/* Partículas */
const canvas = document.getElementById('particulas-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function getCSS(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
 
class Particle {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.pulse = Math.random() * Math.PI * 2;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.pulse += 0.01;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
    }
    draw() {
        const alpha = this.opacity * (0.6 + 0.4 * Math.sin(this.pulse));
        ctx.fillStyle = hexToRgba(getCSS('--cor-ouro') || '#c9a227', alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
};

function hexToRgba(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
}

const particleCount = Math.min(100, Math.floor((canvas.width * canvas.height) / 8000));
for (let i = 0; i < particleCount; i++) particles.push(new Particle());

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    const maxDist = 120;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxDist) {
                const alpha = (1 - dist / maxDist) * 0.2;
                ctx.strokeStyle = hexToRgba(getCSS('--cor-ouro') || '#c9a227', alpha);
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animateParticles);
};
animateParticles();

// Função para botão "Realidade nua e crua"
const botaoRealidade = document.getElementById('btnReal');
const divMostraReal = document.getElementById('mostraReal');

botaoRealidade.addEventListener('click', () => {
    divMostraReal.classList.toggle('visivel');

    if (divMostraReal.classList.contains('visivel')) {
        botaoRealidade.textContent = 'Fechar';
        botaoRealidade.className = 'btn btn-danger';

        const conteudo1 = `
            <h3>Realidade nua e crua</h3>
            <p>Jesus era um judeu apocalíptico, carismático, curador e pregador itinerante. Falava em parábolas simples sobre sementes, pescadores, agricultores — linguagem do povo pobre.</p>
            <p>Ele exigia <strong>entrega total</strong>: “Quem ama seu pai ou mãe mais do que a mim não é digno de mim.” “Toma a tua cruz e segue-me.”</p>
            <p>Ele não veio trazer paz confortável: “Não vim trazer paz, mas espada” (divisão entre quem aceita essa vida radical e quem não aceita).</p>
            <p>Muitos de seus ensinamentos eram tão exigentes que quase ninguém consegue viver plenamente — nem na época dele, nem hoje.</p>
    `;
        divMostraReal.innerHTML = conteudo1;
    } else {
        divMostraReal.classList.remove('visivel');
        botaoRealidade.textContent = 'Realidade nua e crua';
        botaoRealidade.className = 'btn btn-warning';
    }
});

// Botão contador de cliques
let contador = 0;
const btnContador = document.getElementById('btnContador');
const statusMsg = document.getElementById('statusMsg');

btnContador.addEventListener('click', () => {
    contador++;
    btnContador.textContent = `Cliques: ${contador}`;
    statusMsg.textContent = `Você clicou ${contador} vez(es)`;
    statusMsg.style.color = '#fff';
});

// Botão mudar cor de fundo (aleatória)
const btnCor = document.getElementById('btnCor');
let corIndex = 0;
const cores = ['#2c3e50', '#8e44ad', '#c0392b', '#27ae60', '#d35400', '#2980b9'];

btnCor.addEventListener('click', () => {
    document.body.style.background = cores[corIndex];
    corIndex = (corIndex + 1) % cores.length;
    statusMsg.textContent = `Cor alterada para: ${cores[(corIndex - 1 + cores.length) % cores.length]}`;
    statusMsg.style.color = '#fff';
});

// Botão mostrar/esconder citação
const btnToggleTexto = document.getElementById('btnToggleTexto');
const areaCitacao = document.getElementById('areaCitação');

btnToggleTexto.addEventListener('click', () => {
    areaCitacao.classList.toggle('visivel');
    btnToggleTexto.textContent = areaCitacao.classList.contains('visivel') ? 'Esconder citação' : 'Mostrar citação';
});

// Botão resetar tudo
const btnLimpar = document.getElementById('btnLimpar');

btnLimpar.addEventListener('click', () => {
    contador = 0;
    btnContador.textContent = 'Cliques: 0';
    document.body.style.background = ''; // volta ao gradiente original
    areaCitacao.classList.remove('visivel');
    btnToggleTexto.textContent = 'Mostrar citação';
    statusMsg.textContent = 'Tudo foi resetado!';
    statusMsg.style.color = '#f39c12';
});