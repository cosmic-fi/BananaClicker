<script>
	import { slide } from 'svelte/transition';
	import { playerData, upgradesList } from './stores/playerStore';
	import  pkg from '../package.json';

	const version = pkg.version;

	console.log(`%c [🛡️ Banana Guard]`, 'color: red;font-size:20px', ': Running');
	console.log(`%c Banana Version: ${version}`, 'color: yellow;font-size:17px');

	let particleId = 0;
	let particles = [];
	let isSettingsOpen = false;
	let isUpgradeOpen = false;
	let bananaElement;

	let multiplier = 0;

	let bananaParticles = [
		'./bananaParticles/particle1.svg',
		'./bananaParticles/particle2.svg',
		'./bananaParticles/particle3.png',
	];

	// Audio
	let clickSound = new Audio('./sfx/pop-banana.ogg');
	let upgradeSound = new Audio('./sfx/banana-upgrade.ogg');
	let bgMusic = new Audio('./sfx/banana-forest-8bit.ogg');

	bgMusic.volume = 0.3;
	upgradeSound.volume = 0.5;
	clickSound.volume = 0.5;
	bgMusic.loop = true;

	let bananas, 
		bananasPerClick, 
		autoClickPower, 
		soundFX, 
		music, 
		upgrades,
		activeEffects;

	$: mergedUpgrades = upgradesList.map(u => {
		const owned = upgrades?.find(o => o.label === u.label);
		return owned ? { ...u, cost: owned.cost } : u;
	});

	playerData.subscribe(data => {
		bananas = data.bananas;
		bananasPerClick = data.bananasPerClick;
		autoClickPower = data.autoClickPower;
		soundFX = data.soundFX;
		music = data.music;

		multiplier = data.multiplier ?? 1;

		// Avoid updating the store here
		upgrades = data.upgrades;
		activeEffects = data.activeEffects;
	});

	// Play/pause music
	$: {
		if (music) bgMusic.play();
		else bgMusic.pause();
	}

	// --- Click Banana ---
	function clickBanana(event) {
		console.log('ahhh');
		playerData.update(data => {

			console.log(data.bananasPerClick)
			const amountGained = data.bananasPerClick * (data.multiplier || 1);
			const newBananas = data.bananas + amountGained;
			
			spawnParticles(event, 5, data.bananasPerClick);
			animateClick();

			if (data.soundFX) clickSound.cloneNode().play();

			return { ...data, bananas: newBananas };
		});

		console.log($playerData);
	}

	// --- Buy Upgrade ---
	function buyUpgrade(upgrade) {
		playerData.update(data => {
			// Not enough bananas → ignore
			if (data.bananas < upgrade.cost) return data;

			let newData = { ...data };

			// Deduct cost
			newData.bananas -= upgrade.cost;

			// Increase cost by 25% after purchase
			const newCost = Math.ceil(upgrade.cost * 1.25);

			// Update upgrade in data.upgrades array
			const upIndex = newData.upgrades.findIndex(u => u.label === upgrade.label);
			if (upIndex === -1) {
				newData.upgrades.push({ label: upgrade.label, cost: newCost });
			} else {
				newData.upgrades[upIndex].cost = newCost;
			}

			// Apply upgrade effect
			switch (upgrade.type) {
				case 'click':
					newData.bananasPerClick = (newData.bananasPerClick || 0) + upgrade.value;
					break;
				case 'auto':
					newData.autoClickPower = (newData.autoClickPower || 0) + upgrade.value;
					break;
				case 'multiplier':
					newData.multiplier = (newData.multiplier || 0) + upgrade.value;
					break;
				case 'special':
					triggerSpecialEffect(upgrade.label);
					break;
			}

			// Play upgrade sound
			if (data.soundFX) upgradeSound.cloneNode().play();

			return newData;
		});
	}

	// --- Toggle Sound / Music ---
	function toggleSoundFX(value) {
		playerData.update(data => ({ ...data, soundFX: value }));
	}

	function toggleMusic(value) {
		playerData.update(data => ({ ...data, music: value }));
	}

	// --- Auto-clicker ---
	setInterval(() => {
		playerData.update(data => {
			if (data.autoClickPower <= 0) return data;

			const newBananas = data.bananas + data.autoClickPower;
			spawnParticles({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }, 5, data.autoClickPower);
			animateClick();

			if (data.soundFX) clickSound.cloneNode().play();

			return { ...data, bananas: newBananas };
		});
	}, 1000);

	// --- Particle System ---
	function spawnParticles(event, count = 5, value = 1) {
		const newParticles = [];
		for (let i = 0; i < count; i++) {
			const randomImg = bananaParticles[Math.floor(Math.random() * bananaParticles.length)];
			newParticles.push({
				id: particleId++,
				x: event.clientX + (Math.random() * 30 - 15),
				y: event.clientY + (Math.random() * 30 - 15),
				vx: (Math.random() - 0.5) * 6,
				vy: Math.random() * -6 - 2,
				scale: 4 + Math.random() * 0.5,
				scaleSpeed: 0.95 + Math.random() * 0.05,
				opacity: 1,
				opacitySpeed: 0.03 + Math.random() * 0.02,
				rotation: Math.random() * 360,
				rotationSpeed: (Math.random() - 0.5) * 10,
				char: `<img src="${randomImg}" alt="🍌" draggable="false" style="width:20px; height:auto;" />`
			});
		}
		particles = [...particles, ...newParticles];
	}

	function updateParticles() {
		particles = particles
			.map(p => {
				p.x += p.vx;
				p.y += p.vy;
				p.vy += 0.2;
				p.scale *= p.scaleSpeed;
				p.opacity -= p.opacitySpeed;
				p.rotation += p.rotationSpeed;
				return p;
			})
			.filter(p => p.opacity > 0 && p.scale >= 0.1);
	}

	// --- UI ---
	function openUpgrades() { isUpgradeOpen = !isUpgradeOpen; }
	function openSettings() { isSettingsOpen = !isSettingsOpen; }

	function animateClick() {
		bananaElement.style.transform = 'scale(0.9)';
		setTimeout(() => { bananaElement.style.transform = 'scale(1)'; }, 100);
	}

	function animate() {
		updateParticles();
		requestAnimationFrame(animate);
	}
	animate();

	function triggerSpecialEffect(label) {
		if (label === "Banana Rain") {
			for (let i = 0; i < 100; i++) {
				spawnParticles({
					clientX: Math.random() * window.innerWidth,
					clientY: Math.random() * window.innerHeight
				}, 1, 1000);
			}
		} else if (label === "Banana Universe") {
			document.body.style.transition = "background 1s ease";
			document.body.style.background = "linear-gradient(135deg, gold, orange, yellow)";
			setTimeout(() => document.body.style.background = "", 10000)
		}
	}

	// --- Number Formatting ---
	function formatNumber(n) {
		if (n == null || Number.isNaN(n)) return '0';   // catch undefined / null
		const suffixes = [
			'', 'K', 'M', 'B', 'T', 'Q', 'Qi', 'Sx', 'Sp', 'Oc',
			'No', 'Dc', 'Ud', 'Dd', 'Td', 'QaQd', 'SxQd', 'SpQd', 'OcqD',
			'NvD', 'Ugn', 'Tgn', 'Qagn', 'Sxgn', 'Spgn', 'Ocgn', 'Nvgn',
			'Ce', 'Uce', 'Dce', 'Tce', 'Qace', 'Sxce', 'Spce', 'Occe',
			'Nvce', 'Ct', 'Uct', 'Dct', 'Tct', 'Qact', 'Sxct', 'Spct',
			'Occt', 'Nvct', 'Se', 'Use', 'Dse', 'Tse', 'Qase', 'Sxse',
			'Spse', 'Ocse', 'Nvse', 'Og', 'Uog', 'Dog', 'Tog', 'Qaog',
			'Sxog', 'Spog', 'Ocog', 'Nvog', 'Un', 'Dun', 'Tun', 'Qaun',
			'Sxun', 'Spun', 'Ocun', 'Nvn', 'Tr', 'Utr', 'Dtr', 'Ttr',
			'Qatr', 'Sxtr', 'Sptr', 'Octr', 'Nvtr', 'Qd', 'Uqd', 'Dqd',
			'Tqd', 'QaQd', 'SxQd', 'SpQd', 'OcqD', 'NvQd', 'Qt', 'Uqt',
			'Dqt', 'Tqt', 'Qaqt', 'Sxqt', 'Spqt', 'Ocqt', 'Nvqt', 'Sxqt',
			'Spqt', 'Ocqt', 'Nvqt', 'Qn', 'Uqn', 'Dqn', 'Tqn', 'Qaqn',
			'Sxn', 'Spn', 'Ocn', 'Nvn', 'Qag', 'Uqag', 'Dqag', 'Tqag',
			'Qaqag', 'Sxqag', 'Spqag', 'Ocqag', 'Nvqag', 'Mul', 'Umu',
			'Dmu', 'Tmu', 'Qamu', 'Sxmu', 'Spmu', 'Ocmu', 'Nvmu'
		];
		let i = 0;
		while (n >= 1000 && i < suffixes.length - 1) { n /= 1000; i++; }
		return (n % 1 === 0 ? n : Number(n.toFixed(2))) + suffixes[i];
	}
</script>

<main>
	<div class="header">
		<h1 class="title">
			<img src="./logo.png" alt="🍌" draggable="false" style="width:200px; height:auto; vertical-align: middle; margin-right: 5px;" />
			<span class="version">v{version}</span>
		</h1>
		<button class="menu" aria-label="Settings" on:click={openSettings}>
			<i class="fa fa-gear"></i>
		</button>
	</div>

	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="game-area">
		<span class="score-count">
			<img src="./banana.png" alt="🍌" draggable="false" style="width:30px; height:auto; vertical-align: middle; margin-right: 5px;" />	 
			{formatNumber(bananas)}
		</span>
		<!-- Central banana -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div bind:this={bananaElement} class="banana-center" on:click={clickBanana}>
			<img src="./bananaman.png" alt="🍌" draggable="false" />
		</div>

		<button class="upgrade-button" on:click={openUpgrades}>
			{#if isUpgradeOpen}
				Close Upgrades
			{:else}
				Upgrades
			{/if}
		</button>
		<spna class="multipliers">x{formatNumber(multiplier)} Multiplier</spna>
		<spna class="autoClickPower">+{formatNumber(autoClickPower)}/s (Auto)</spna>
		<spna class="clickBuff">+{formatNumber(bananasPerClick)}/Click</spna>
		
		<a href="https://github.com/cosmic-fi" class="githublink" target="_blank" aria-label="Github"><i class="fa-brands fa-github"></i></a>
	</div>

	<!-- Particle layer -->
	<div class="particle-container">
		{#each particles as p (p.id)}
			<span 
				class="particle"
				style="
					left: {p.x}px; 
					top: {p.y}px; 
					transform: rotate({p.rotation}deg) scale({p.scale});
					opacity: {p.opacity};
				">
				{@html p.char}
			</span>
		{/each}
	</div>

	<!-- Upgrades sidebar -->
	{#if isUpgradeOpen}
		<aside class="upgrades">
			<div class="upgrade-wrapper" transition:slide>
			<div class="upgrade-header">
				<h2>Upgrades</h2>
				<button class="upgrade-close-btn" aria-label="Close" on:click={openUpgrades}>
				<i class="fa fa-xmark"></i>
				</button>
			</div>
			<p>Click to buy, cost increases each purchase:</p>
			<div class="upgrades-container">
				{#each mergedUpgrades as upgrade}
					<button 
						on:click={() => buyUpgrade(upgrade)}
						disabled={bananas < upgrade.cost}>
						{upgrade.name} ({formatNumber(upgrade.cost)}) <img src="./banana.png" alt="🍌" draggable="false" style="width:15px; height:auto; vertical-align: middle; margin-left: 5px;" />
					</button>
				{/each}
			</div>
			<div class="upgrade-footer">
				<span class="bperclick">+{formatNumber(bananasPerClick)}/Click</span>
				<span>Total bananas: {formatNumber(bananas)}</span>
			</div>
			</div>
		</aside>
	{/if}
	{#if isSettingsOpen}
		<aside class="settings">
			<div class="settings-wrapper" transition:slide>
				<div class="settings-header">
					<h2>Settings</h2>
					<button class="settings-close-btn" aria-label="Close" on:click={openSettings}>
						<i class="fa fa-xmark"></i>
					</button>
				</div>

				<div class="settings-options">
					<div class="setting-item">
						<span>Sound FX</span>
						<label class="toggle">
							<input type="checkbox" checked={soundFX} on:change={e => toggleSoundFX(e.target.checked)} />
							<span class="slider"></span>
						</label>
					</div>

					<div class="setting-item">
						<span>Music</span>
						<label class="toggle">
							<input type="checkbox" checked={music} on:change={e => toggleMusic(e.target.checked)} />
							<span class="slider"></span>
						</label>
					</div>
				</div>
			</div>
		</aside>
	{/if}
</main>

<style>
	main {
		font-family: "Comic Neue", monospace;
		background: linear-gradient(to right, #fff8d6, #fffbe8, #fff8d6);
		width: 550px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
		border-inline: 2px dashed #f4d03f;
		height: 100%;
	}

	.header {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 10px;
		border-bottom: 2px dashed #f4d03f;
	}

	.menu {
		font-size: 1.5rem;
		background: none;
		border: none;
		cursor: pointer;
		background-color: #ffe135;
		display: flex;
		justify-content: center;
		margin: 0;
		border-radius: 5px;
		color: #584a12;
		box-shadow: 0 0 0 2px #ffffff;
	}

	.title {
		font-size: 1.5rem;
		padding: 0;
		margin: 0;
		color: #584a12;
		display: flex;
		font-weight: bolder;
		flex-direction: row;
		align-items: center;
	}

	.version {
		font-size: 1rem;
		color: #a09050;
		margin-left: 0.5rem;
	}

	.game-area {
		display: flex;
		gap: 3rem;
		align-items: flex-start;
		flex: 1;
		justify-content: center;
		align-items: center;
		position: relative;
	}

	.score-count{
		position: absolute;
		top: 1rem;
		display: flex;
		align-items: center;
		font-size: 2rem;
		color: #584a12;
		font-weight: bold;
	}

	.banana-center {
		font-size: 10rem;
		cursor: pointer;
		user-select: none;
		transition: transform 0.1s;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.banana-center img {
		width: 250px;
		height: auto;
	}

	.upgrade-button {
		position: absolute;
		bottom: .5rem;
		left: 1rem;
		padding: 0.5rem 1rem;
		font-size: 1rem;
		border-radius: 8px;
		border: none;
		background-color: #ffe135;
		cursor: pointer;
		transition: transform 0.1s;
		box-shadow: 0 0 0 2px #ffffff;
	}

	.multipliers{
		position: absolute;
		bottom: 6.4rem;
		left: 1rem;
		font-size: 1.2rem;
		font-weight: bold;
		color: #584a12;
	}
	.autoClickPower{
		position: absolute;
		bottom: 5rem;
		left: 1rem;
		font-size: 1.2rem;
		font-weight: bold;
		color: #584a12;
	}
	.active-effects {
		position: fixed;
		top: 1rem;
		right: 1rem;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		padding: 10px;
		border-radius: 8px;
		font-family: monospace;
		color: yellow;
	}

	.clickBuff{
		position: absolute;
		bottom: 3.5rem;
		left: 1rem;
		font-size: 1.2rem;
		font-weight: bold;
		color: #584a12;
	}

	.githublink {
		position: absolute;
		bottom: .5rem;
		right: 1rem;
		font-size: 2rem;
		color: #584a12;
		text-decoration: none;
	}
	.upgrades {
		display: flex;
		position: absolute;
		flex-direction: column;
		width: 100%;
		background: #fff6b825;
		height: 100%;
		align-items: center;
		backdrop-filter: blur(2px);
		z-index: 999;
	}

	.upgrade-wrapper {
		display: flex;
		position: absolute;
		flex-direction: column;
		gap: 0.5rem;
		width: calc(100% - 3rem);
		bottom: -.4rem;
		background: #fff5b8;
		padding: 1rem;
		height: 80%;
		border-radius: 12px;
		border: 2px solid #f4d03f;
	}

	.upgrade-header{
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px dashed #f4d03f;
	}

	.upgrade-close-btn{
		font-size: 1.2rem;
		background: none;
		border: none;
		cursor: pointer;
		background-color: #ffe135;
		display: flex;
		justify-content: center;
		margin: 0;
		border-radius: 5px;
		color: #584a12;
		box-shadow: 0 0 0 2px #ffffff;
		padding: 0.2rem 0.5rem;

	}
	.upgrades-container {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		/* max-height: 300px; */
		overflow: hidden;
		overflow-y: auto;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.upgrades button {
		cursor: pointer;
		padding: 0.5rem;
		font-size: 1rem;
		border-radius: 8px;
		border: none;
		background-color: #ffe135;
		transition: transform 0.1s;
	}
	.upgrades button:active {
		transform: scale(0.95);
	}
	.upgrades button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.upgrade-footer {
		/* margin-top: 1rem; */
		border-top: 1px dashed #f4d03f;
		padding-block: 0.5rem;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}

	.bperclick {
		font-weight: bold;
		color: #584a12;
	}
	
	.particle-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		overflow: visible;
	}

	.particle {
		position: absolute;
		font-size: 1.5rem;
		user-select: none;
		will-change: transform, opacity;
		color: #f5d800;
		font-weight: bold;
	}

	@media (max-width: 400px) {
		main {
			width: 98%;
			border-inline: 1px dashed #f4d03f;
		}

		.title {
			font-size: 1.2rem;
		}
	}


	.settings {
		display: flex;
		position: absolute;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		background: #fff6b825;
		height: 100%;
		align-items: center;
		backdrop-filter: blur(2px);
		z-index: 999;
	}
	.settings-wrapper {
		display: flex;
		position: absolute;
		flex-direction: column;
		gap: 0.5rem;
		width: calc(100% - 3rem);
		bottom: -.4rem;
		background: #fff5b8;
		padding: 1rem;
		height: 50%;
		border-radius: 12px;
		border: 2px solid #f4d03f;
	}

	.settings-header {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px dashed #f4d03f;
	}

	.settings-close-btn {
		font-size: 1.2rem;
		background-color: #ffe135;
		border: none;
		border-radius: 5px;
		color: #584a12;
		box-shadow: 0 0 0 2px #ffffff;
		cursor: pointer;
		padding: 0.5rem 0.5rem;
	}

	.settings-options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-top: 1rem;
		overflow: hidden;
		overflow-y: auto;
	}

	.setting-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 1.1rem;
		color: #584a12;
		font-weight: bold;
	}

	/* Custom Toggle Switch */
	.toggle {
		position: relative;
		display: inline-block;
		width: 50px;
		height: 26px;
	}

	.toggle input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #d1c47a;
		border-radius: 34px;
		transition: 0.3s;
	}

	.slider:before {
		position: absolute;
		content: "";
		height: 20px;
		width: 20px;
		left: 3px;
		bottom: 3px;
		background-color: white;
		border-radius: 50%;
		transition: 0.3s;
	}

	input:checked + .slider {
		background-color: #ffe135;
	}

	input:checked + .slider:before {
		transform: translateX(24px);
	}

</style>
