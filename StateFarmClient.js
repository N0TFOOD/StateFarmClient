// ==UserScript==
// @name         StateFarm Client
// @namespace    http://tampermonkey.net/
// @version      1.1.4
// @description  Aimbot + Tracers + Wallhack; Keybinds V, C, N.
// @author       JakeFromStateFarm
// @match        *://shellshock.io/*
// @match        https://shellshock.io/*
// @match        https://eggcombat.com/*
// @match        https://eggfacts.fun/*
// @match        https://biologyclass.club/*
// @match        https://egghead.institute/*
// @match        https://egg.dance/*
// @match        https://eggisthenewblack.com/*
// @match        https://mathfun.rocks/*
// @match        https://hardboiled.life/*
// @match        https://overeasy.club/*
// @match        https://zygote.cafe/*
// @match        https://eggsarecool.com/*
// @match        https://deadlyegg.com/*
// @match        https://mathgames.world/*
// @match        https://hardshell.life/*
// @match        https://violentegg.club/*
// @match        https://yolk.life/*
// @match        https://softboiled.club/*
// @match        https://scrambled.world/*
// @match        https://algebra.best/*
// @match        https://scrambled.today/*
// @match        https://deathegg.world/*
// @match        https://violentegg.fun/*
// @match        *://mathactivity.xyz/*
// @match        *://math.international/*
// @match        *://geometry.pw/*
// @icon         https://futureclient.net/ogTwitter.jpg
// @grant        none
// @run-at       document-start
// @antifeature  ads
// ==/UserScript==

XMLHttpRequest = class extends XMLHttpRequest {

	open( method, url ) {

		if ( url.indexOf( 'shellshock.js' ) > - 1 ) {

			this.isScript = true;

		}

		return super.open( ...arguments );

	}

	get response() {

		if ( this.isScript ) {

			const code = super.response;

			const babylonVarName = /new ([a-zA-Z]+)\.Vector3/.exec( code )[ 1 ];
			const playersVarName = /([^,]+)=\[\],{}/.exec( code )[ 1 ];
			const myPlayerVarName = /"fire":document.pointerLockElement&&([^&]+)&&/.exec( code )[ 1 ];
			const sceneVarName = /createMapCells\(([^,]+),/.exec( code )[ 1 ];
			const cullFuncName = /=([a-zA-Z]+)\(this\.mesh,\.[0-9]+\)/.exec( code )[ 1 ];

			console.log( '%cInjecting code...', 'color: red; background: black; font-size: 2em;', {
				babylonVarName,
				playersVarName,
				myPlayerVarName,
				playersVarName,
				sceneVarName,
				cullFuncName
			} );

			return code.replace( sceneVarName + '.render()', `( function () {
				const players = ${playersVarName};
				const myPlayer = ${myPlayerVarName};
				const BABYLON = ${babylonVarName};
				if ( ! myPlayer ) {
					return;
				}
				if ( ! window.lineOrigin ) {
					window.lineOrigin = new BABYLON.Vector3();
					window.lines = [];
				}
				window.lineOrigin.copyFrom( myPlayer.actor.mesh.position );
				const yaw = myPlayer.actor.mesh.rotation.y;
				window.lineOrigin.x += Math.sin( yaw );
				window.lineOrigin.z += Math.cos( yaw );
				window.lineOrigin.y += Math.sin( - myPlayer.pitch );
				for ( let i = 0; i < window.lines.length; i ++ ) {
					window.lines[ i ].playerExists = false;
				}
				for ( let i = 0; i < players.length; i ++ ) {
					const player = players[ i ];
					if ( ! player || player === myPlayer ) {
						continue;
					}
					if ( player.sphere === undefined ) {
						console.log( 'Adding sphere...' );
						const material = new BABYLON.StandardMaterial( 'myMaterial', player.actor.scene );
						material.emissiveColor = material.diffuseColor = new BABYLON.Color3( 1, 0, 0 );
						material.wireframe = true;
						const sphere = BABYLON.MeshBuilder.CreateBox( 'mySphere', { width: 0.5, height: 0.75, depth: 0.5 }, player.actor.scene );
						sphere.material = material;
						sphere.position.y = 0.3;
						sphere.parent = player.actor.mesh;
						player.sphere = sphere;
					}
					if ( player.lines === undefined ) {
						const options = {
							points: [ window.lineOrigin, player.actor.mesh.position ],
							updatable: true
						};
						const lines = options.instance = BABYLON.MeshBuilder.CreateLines( 'lines', options, player.actor.scene );
						lines.color = new BABYLON.Color3( 1, 0, 0 );
						lines.alwaysSelectAsActiveMesh = true;
						lines.renderingGroupId = 1;
						player.lines = lines;
						player.lineOptions = options;
						window.lines.push( lines );
						console.log( '%cAdding line...', 'color: green; background: black; font-size: 2em;' );
					}
					player.lines.playerExists = true;
					player.lines = BABYLON.MeshBuilder.CreateLines( 'lines', player.lineOptions );
					player.sphere.renderingGroupId = window.espEnabled ? 1 : 0;
					player.sphere.visibility = ( window.aimbotEnabled || window.espEnabled ) && myPlayer !== player && ( myPlayer.team === 0 || myPlayer.team !== player.team );
					player.lines.visibility = player.playing && player.sphere.visibility && window.showLines;
				}
				for ( let i = 0; i < window.lines.length; i ++ ) {
					if ( ! window.lines[ i ].playerExists ) {
						console.log( '%cRemoving line...', 'color: red; background: black; font-size: 2em;' );
						window.lines[ i ].dispose();
						window.lines.splice( i, 1 );
					}
				}
				if ( window.aimbotEnabled && myPlayer.playing ) {
					let minDistance = Infinity;
					let targetPlayer;
					for ( let i = 0; i < players.length; i ++ ) {
						const player = players[ i ];
						if ( player && player !== myPlayer && player.playing && ( myPlayer.team === 0 || player.team !== myPlayer.team ) ) {
							const distance = Math.hypot( player.x - myPlayer.x, player.y - myPlayer.y, player.z - myPlayer.z );
							if ( distance < minDistance ) {
								minDistance = distance;
								targetPlayer = player;
							}
						}
					}
					if ( targetPlayer ) {
						const x = targetPlayer.actor.mesh.position.x - myPlayer.actor.mesh.position.x;
						const y = targetPlayer.actor.mesh.position.y - myPlayer.actor.mesh.position.y;
						const z = targetPlayer.actor.mesh.position.z - myPlayer.actor.mesh.position.z;
						myPlayer.yaw = Math.radAdd( Math.atan2( x, z ), 0 );
						myPlayer.pitch = - Math.atan2( y, Math.hypot( x, z ) ) % 1.5;
					}
				}
			} )(); ${sceneVarName}.render()` )
				.replace( `function ${cullFuncName}`, `
					function ${cullFuncName}() {
						return true;
					}
				function someFunctionWhichWillNeverBeUsedNow` );

		}

		return super.response;

	}

};

window.espEnabled = true;
window.aimbotEnabled = true;
window.showLines = true;

window.addEventListener( 'keyup', function ( event ) {

	if ( document.activeElement && document.activeElement.tagName === 'INPUT' ) {

		return;

	}

	switch ( String.fromCharCode( event.keyCode ) ) {

		case 'C':

			window.aimbotEnabled = ! window.aimbotEnabled;

			break;

		case 'V':

			window.espEnabled = ! window.espEnabled;

			break;

		case 'N':

			window.showLines = ! window.showLines;

			break;

	}

} );

window.addEventListener( 'DOMContentLoaded', async function () {

	const value = parseInt( new URLSearchParams( window.location.search ).get( 'showAd' ), 16 );

	const temp = document.createElement( 'div' );

	temp.innerHTML = '<div class="popup_window popup_lg centered roundme_lg" style="z-index: 9999999;">' +
		( shouldShowAd ? `<h1 class="roundme_sm">Loading ad...</h1>` : `<button class="popup_close clickme roundme_sm" onclick="this.parentNode.style.display='none';"></button>
		<h1 class="roundme_sm">Aimbot & ESP!</h1>
		<h4 style="text-align:center;">
			[B] to toggle aimbot
			<br>
			[V] to toggle ESP
			<br>
			[N] to toggle ESP lines
			<br>
			<br>
			By Zertalious
		</h4>
		<div id="btn-horizontal" class="f-center">
			<button class="ss_button btn_red bevel_red btn_sm" onclick="window.open('https://discord.gg/K24Zxy88VM', '_blank')">Discord</button>
			<button class="ss_button btn_yolk bevel_yolk btn_sm" onclick="window.open('https://greasyfork.org/en/users/662330-zertalious', '_blank')">More scripts</button>
		</div>
		<div id="btn-horizontal" class="f-center">
			<button class="ss_button btn_green bevel_green btn_sm" onclick="window.open('https://www.instagram.com/zertalious/', '_blank')">Instagram</button>
			<button class="ss_button btn_blue bevel_blue btn_sm" onclick="window.open('https://twitter.com/Zertalious', '_blank')">Twitter</button>
		</div>` ) +
	'</div>';

	document.body.appendChild( temp.children[ 0 ] );

	if ( shouldShowAd ) {

		const url = new URL( window.location.href );

		url.searchParams.set( 'showAd', Date.now().toString( 16 ) );

		window.location.href = 'https://zertalious.xyz?ref=' + new TextEncoder().encode( url.href ).toString();

	}

} );

//AdBlocker for Shellshockers

document.getElementById("shellshock-io_300x250").remove();

document.getElementById("preroll").remove();

var aipGameContainer = document.getElementById('aipGameContainer');
     aipGameContainer.style = " ";
     
