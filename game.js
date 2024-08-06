const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const cakeImages = [];
const cakeCount = 5; // Number of different cake images
const backgroundImage = new Image();
backgroundImage.src = 'background.png'; // Replace with the path to your background image

let loading = false;
let apiImage = new Image();

function loadImages(callback) {
    let loadedImages = 0;

    for (let i = 1; i <= cakeCount; i++) {
        const img = new Image();
        img.src = `cake${i}.png`;
        img.onload = () => {
            loadedImages++;
            if (loadedImages === cakeCount) {
                callback();
            }
        };
        cakeImages.push(img);
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);

class Cake {
    constructor(x, y, vx, vy, img) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.image = img;
        this.width = img.naturalWidth;
        this.height = img.naturalHeight;
        this.radius = Math.max(this.width, this.height) / 2;
    }

    draw() {
        ctx.drawImage(this.image, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Check for collisions with screen edges and add a small buffer
        if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.vx *= -1;
        }
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= -1;
        }
        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            this.vy *= -1;
        }
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy *= -1;
        }

        // Check for collisions with other cakes
        for (let cake of cakes) {
            if (cake !== this) {
                const dx = cake.x - this.x;
                const dy = cake.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < this.radius + cake.radius) {
                    // Calculate angle of collision
                    const angle = Math.atan2(dy, dx);
                    const sine = Math.sin(angle);
                    const cosine = Math.cos(angle);

                    // Rotate velocities
                    const vx1 = cosine * this.vx + sine * this.vy;
                    const vy1 = cosine * this.vy - sine * this.vx;
                    const vx2 = cosine * cake.vx + sine * cake.vy;
                    const vy2 = cosine * cake.vy - sine * cake.vx;

                    // Swap velocities
                    this.vx = cosine * vx2 - sine * vy1;
                    this.vy = cosine * vy1 + sine * vx2;
                    cake.vx = cosine * vx1 - sine * vy2;
                    cake.vy = cosine * vy2 + sine * vx1;

                    // Move them apart to avoid overlap
                    const overlap = this.radius + cake.radius - distance;
                    const moveX = cosine * overlap / 2;
                    const moveY = sine * overlap / 2;
                    this.x -= moveX;
                    this.y -= moveY;
                    cake.x += moveX;
                    cake.y += moveY;
                }
            }
        }
    }
}

const cakes = [];

function init() {
    loadImages(() => {
        for (let i = 0; i < 10; i++) { // Change the number to add more or fewer cakes
            // Ensure the initial position is away from the edges
            const x = Math.random() * (canvas.width - 100) + 50;
            const y = Math.random() * (canvas.height - 100) + 50;
            const vx = (Math.random() - 0.5) * 4;
            const vy = (Math.random() - 0.5) * 4;
            const img = cakeImages[Math.floor(Math.random() * cakeImages.length)];
            cakes.push(new Cake(x, y, vx, vy, img));
        }

        animate();
    });
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    for (let cake of cakes) {
        cake.update();
        cake.draw();
    }

    if (loading) {
        ctx.fillStyle = 'black';
        ctx.font = '30px Arial';
        ctx.fillText('Loading...', canvas.width / 2 - 60, canvas.height / 2);
    } else if (apiImage.src) {
        ctx.drawImage(apiImage, canvas.width / 2 - apiImage.width / 2, canvas.height / 2 - apiImage.height / 2);
        ctx.fillStyle = 'black';
        ctx.font = '30px Arial';
        ctx.fillText('Call API Done', canvas.width / 2 - 70, canvas.height / 2 + apiImage.height / 2 + 30);
    }

    requestAnimationFrame(animate);
}

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

canvas.addEventListener('click', function(evt) {
    const mousePos = getMousePos(canvas, evt);

    for (let cake of cakes) {
        const dx = mousePos.x - cake.x;
        const dy = mousePos.y - cake.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < cake.radius) {
            loading = true;
            fetch('https://picsum.photos/300')
                .then(response => {
                    return response.blob();
                })
                .then(blob => {
                    apiImage.src = URL.createObjectURL(blob);
                    apiImage.onload = () => {
                        loading = false;
                    };
                })
                .catch(error => {
                    console.error('Error fetching the image:', error);
                    loading = false;
                });
            break;
        }
    }
});

window.onload = init;
