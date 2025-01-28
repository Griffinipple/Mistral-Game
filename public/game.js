const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.PointerLockControls(camera, document.body);
scene.add(controls.getObject());

document.addEventListener('click', () => {
    controls.lock();
});

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

const socket = io();

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

socket.on('playerRespawn', (data) => {
    controls.getObject().position.copy(data.position);
});

let health = 100;

function createHealthBar() {
    const healthBar = document.createElement('div');
    healthBar.style.position = 'absolute';
    healthBar.style.top = '10px';
    healthBar.style.left = '10px';
    healthBar.style.width = '200px';
    healthBar.style.height = '20px';
    healthBar.style.backgroundColor = 'red';
    document.body.appendChild(healthBar);
    return healthBar;
}

const healthBar = createHealthBar();

function updateHealthBar() {
    healthBar.style.width = `${health}px`;
}

function takeDamage(amount) {
    health -= amount;
    if (health <= 0) {
        health = 0;
        respawn();
    }
    updateHealthBar();
}

function heal(amount) {
    health += amount;
    if (health > 100) health = 100;
    updateHealthBar();
}

function respawn() {
    health = 100;
    updateHealthBar();
    controls.getObject().position.set(0, 1, 0);
    socket.emit('respawn', { position: controls.getObject().position });
}

setInterval(() => {
    takeDamage(10);
}, 2000);

setInterval(() => {
    heal(5);
}, 3000);

const onKeyDown = (event) => {
    switch (event.code) {
        case 'KeyW':
            controls.moveForward(0.1);
            break;
        case 'KeyA':
            controls.moveRight(-0.1);
            break;
        case 'KeyS':
            controls.moveForward(-0.1);
            break;
        case 'KeyD':
            controls.moveRight(0.1);
            break;
        case 'Space':
            jump();
            break;
        case 'KeyP':
            createParty();
            break;
    }
};

document.addEventListener('keydown', onKeyDown);

let canJump = true;

function jump() {
    if (canJump) {
        controls.getObject().position.y += 1;
        canJump = false;
        setTimeout(() => {
            canJump = true;
        }, 500);
    }
}

let party = [];

function createParty() {
    const partyId = Math.random().toString(36).substring(2, 15);
    party.push(partyId);
    socket.emit('createParty', partyId);
    console.log(`Created party: ${partyId}`);
}

const projectileGeometry = new THREE.SphereGeometry(0.1, 32, 32);
const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });

function shootProjectile() {
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
    projectile.position.copy(camera.position);
    projectile.position.add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(1));
    scene.add(projectile);

    const velocity = new THREE.Vector3().copy(camera.getWorldDirection(new THREE.Vector3())).multiplyScalar(0.1);
    projectile.userData.velocity = velocity;
}

document.addEventListener('mousedown', shootProjectile);

function updateProjectiles() {
    scene.traverse((object) => {
        if (object.userData.velocity) {
            object.position.add(object.userData.velocity);
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    updateProjectiles();
    renderer.render(scene, camera);
}
animate();
