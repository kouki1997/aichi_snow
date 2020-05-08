let vid = document.getElementById('videoel');
let vid_width = vid.width;
let vid_height = vid.height;
let overlay = document.getElementById('overlay');
let overlayCC = overlay.getContext('2d');

/*********** Setup of video/webcam and checking for webGL support *********/

function enablestart() {
	let startbutton = document.getElementById('startbutton');
	startbutton.value = "start";
	startbutton.disabled = null;
}

let insertAltVideo = function (video) {
	// insert alternate video if getUserMedia not available
	if (supports_video()) {
		if (supports_webm_video()) {
			video.src = "./media/cap12_edit.webm";
		} else if (supports_h264_baseline_video()) {
			video.src = "./media/cap12_edit.mp4";
		} else {
			return false;
		}
		return true;
	} else return false;
}

function adjustVideoProportions() {
	// resize overlay and video if proportions of video are not 4:3
	// keep same height, just change width
	let proportion = vid.videoWidth / vid.videoHeight;
	vid_width = Math.round(vid_height * proportion);
	vid.width = vid_width;
	overlay.width = vid_width;
}

function gumSuccess(stream) {
	// add camera stream if getUserMedia succeeded
	if ("srcObject" in vid) {
		vid.srcObject = stream;
	} else {
		vid.src = (window.URL && window.URL.createObjectURL(stream));
	}
	vid.onloadedmetadata = function () {
		adjustVideoProportions();
		vid.play();
	}
	vid.onresize = function () {
		adjustVideoProportions();
		if (trackingStarted) {
			ctrack.stop();
			ctrack.reset();
			ctrack.start(vid);
		}
	}
}

function gumFail() {
	// fall back to video if getUserMedia failed
	insertAltVideo(vid);
	document.getElementById('gum').className = "hide";
	document.getElementById('nogum').className = "nohide";
	alert("There was some problem trying to fetch video from your webcam, using a fallback video instead.");
}

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;

// set up video
if (navigator.mediaDevices) {
	navigator.mediaDevices.getUserMedia({ video: true }).then(gumSuccess).catch(gumFail);
} else if (navigator.getUserMedia) {
	navigator.getUserMedia({ video: true }, gumSuccess, gumFail);
} else {
	insertAltVideo(vid);
	document.getElementById('gum').className = "hide";
	document.getElementById('nogum').className = "nohide";
	alert("Your browser does not seem to support getUserMedia, using a fallback video instead.");
}

vid.addEventListener('canplay', enablestart, false);

/*********** Code for face tracking *********/

let ctrack = new clm.tracker();
ctrack.init();
let trackingStarted = false;

function startVideo() {
	// start video
	vid.play();
	// start tracking
	ctrack.start(vid);
	trackingStarted = true;
	// start loop to draw face
	drawLoop();
}

//gifの表示の仕方検討
let canvas = document.getElementById("overlay");         // canvas 要素の取得
let context = canvas.getContext("2d");                  // canvas の context の取得
let stampNose = new Image();
let stampEars = new Image();
let stampGlasses = new Image();
let stampEars2 = new Image();
let gifImage1 = new Image();
let gifImage2 = new Image();
let gifImage3 = new Image();

stampNose.src = "images/nose2.png";
stampEars.src = "images/ears.png";
stampGlasses.src = "images/glasses.png";
stampEars2.src = "images/ears2.png";
gifImage1.src = "images/gif1.gif";
gifImage2.src = "images/gif2.gif";
gifImage3.src = "images/gif3.gif";

function drawLoop() {
	requestAnimFrame(drawLoop);
	overlayCC.clearRect(0, 0, vid_width, vid_height);
	//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊
	let positions = ctrack.getCurrentPosition();         // 顔部品の現在位置の取得
	//showData(positions);                                  // データの表示
	// (顔部品の位置データ, 画像, 基準位置, 大きさ, 横シフト, 縦シフト)
	drawStamp(positions, stampNose, 62, 2.5, 0.0, 0.0);   // ★鼻のスタンプを描画
	//drawStamp(positions, stampEars, 33, 3.0, 0.0, -1.8);  // ★耳のスタンプを描画
	drawStamp(positions, stampGlasses, 40, 2.5, -0.3, -0.5); //メガネのスタンプを描画
	drawStamp(positions, stampEars2, 33, 3.0, 0.0, -1.8); // 猫の耳
	drawStamp(positions, gifImage1, 33, 2.0, 0.0, -2.1); // gif画像
	//drawStamp(positions, gifImage2, 33, 3.0, 0.0, -1.8); // gif画像
	//drawStamp(positions, gifImage3, 33, 3.0, 0.0, -1.8);

	//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊
	//psrElement.innerHTML = "score :" + ctrack.getScore().toFixed(4);
	if (ctrack.getCurrentPosition()) {
		//ctrack.draw(overlay);//緑の顔の線を描画する
	}
}

// 顔部品（特徴点）の位置データを表示する showData 関数
function showData(pos) {
	let str = "";                                         // データの文字列を入れる変数
	for (let i = 0; i < pos.length; i++) {                 // 全ての特徴点（71個）について
		str += "特徴点" + i + ": ("
			+ Math.round(pos[i][0]) + ", "                 // X座標（四捨五入して整数に）
			+ Math.round(pos[i][1]) + ")<br>";             // Y座標（四捨五入して整数に）
	}
	let dat = document.getElementById("dat");             // データ表示用div要素の取得
	dat.innerHTML = str;                                  // データ文字列の表示
}

// ★スタンプを描く drawStamp 関数
// (顔部品の位置データ, 画像, 基準位置, 大きさ, 横シフト, 縦シフト)
function drawStamp(pos, img, bNo, scale, hShift, vShift) {
	if (pos == false) return true; //これがないと、検知されなかった時にundefinedになる
	let eyes = pos[32][0] - pos[27][0];                   // 幅の基準として両眼の間隔を求める
	let nose = pos[62][1] - pos[33][1];                   // 高さの基準として眉間と鼻先の間隔を求める
	let wScale = eyes / img.width;                        // 両眼の間隔をもとに画像のスケールを決める
	let imgW = img.width * scale * wScale;                // 画像の幅をスケーリング
	let imgH = img.height * scale * wScale;               // 画像の高さをスケーリング
	let imgL = pos[bNo][0] - imgW / 2 + eyes * hShift;    // 画像のLeftを決める
	let imgT = pos[bNo][1] - imgH / 2 + nose * vShift;    // 画像のTopを決める
	context.drawImage(img, imgL, imgT, imgW, imgH);       // 画像を描く
}

/*********** Code for stats **********/

stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
document.getElementById('container').appendChild(stats.domElement);

// update stats on every iteration
document.addEventListener('clmtrackrIteration', function (event) {
	stats.update();
}, false);
