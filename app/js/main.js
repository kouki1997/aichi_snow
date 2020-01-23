				var vid = document.getElementById('videoel');
				var vid_width = vid.width;
				var vid_height = vid.height;
				var overlay = document.getElementById('overlay');
				var overlayCC = overlay.getContext('2d');

				/*********** Setup of video/webcam and checking for webGL support *********/

				function enablestart() {
					var startbutton = document.getElementById('startbutton');
					startbutton.value = "start";
					startbutton.disabled = null;
				}

				var insertAltVideo = function(video) {
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
					var proportion = vid.videoWidth/vid.videoHeight;
					vid_width = Math.round(vid_height * proportion);
					vid.width = vid_width;
					overlay.width = vid_width;
				}

				function gumSuccess( stream ) {
					// add camera stream if getUserMedia succeeded
					if ("srcObject" in vid) {
						vid.srcObject = stream;
					} else {
						vid.src = (window.URL && window.URL.createObjectURL(stream));
					}
					vid.onloadedmetadata = function() {
						adjustVideoProportions();
						vid.play();
					}
					vid.onresize = function() {
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
					navigator.mediaDevices.getUserMedia({video : true}).then(gumSuccess).catch(gumFail);
				} else if (navigator.getUserMedia) {
					navigator.getUserMedia({video : true}, gumSuccess, gumFail);
				} else {
					insertAltVideo(vid);
					document.getElementById('gum').className = "hide";
					document.getElementById('nogum').className = "nohide";
					alert("Your browser does not seem to support getUserMedia, using a fallback video instead.");
				}

				vid.addEventListener('canplay', enablestart, false);

				/*********** Code for face tracking *********/

				var ctrack = new clm.tracker();
				ctrack.init();
				var trackingStarted = false;

				function startVideo() {
					// start video
					vid.play();
					// start tracking
					ctrack.start(vid);
					trackingStarted = true;
					// start loop to draw face
					drawLoop();
				}

var canvas = document.getElementById("overlay");         // canvas 要素の取得
var context = canvas.getContext("2d");                  // canvas の context の取得
var stampNose = new Image();                           
var stampEars = new Image();                        
var stampGlasses = new Image();                     
var stampEars2 = new Image();
var gifImage = new Image();

stampNose.src = "nose.png";                        
stampEars.src = "ears.png";                           
stampGlasses.src = "glasses.png";       				 
stampEars2.src = "ears2.png";
//gifImage.src = "images/osiri.gif";
gifImage.src = "images/gif2.gif";

				function drawLoop() {
					requestAnimFrame(drawLoop);
					overlayCC.clearRect(0, 0, vid_width, vid_height);
					//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊
					  var positions = ctrack.getCurrentPosition();         // 顔部品の現在位置の取得
  					  showData(positions);                                  // データの表示
  					  // (顔部品の位置データ, 画像, 基準位置, 大きさ, 横シフト, 縦シフト)
  					  drawStamp(positions, stampNose, 62, 2.5, 0.0, 0.0);   // ★鼻のスタンプを描画
  				      //drawStamp(positions, stampEars, 33, 3.0, 0.0, -1.8);  // ★耳のスタンプを描画
  				      drawStamp(positions,stampGlasses,40, 2.5, -0.3, -0.5); //メガネのスタンプを描画
  				      drawStamp(positions, stampEars2, 33, 3.0, 0.0, -1.8); // 猫の耳

                  //drawStamp(positions, gifImage, 33, 3.0, 0.0, -1.8); // gif画像

  				      //＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊
					//psrElement.innerHTML = "score :" + ctrack.getScore().toFixed(4);
					if (ctrack.getCurrentPosition()) {
						//ctrack.draw(overlay);//緑の顔の線を描画する
					}
				}
				
				// 顔部品（特徴点）の位置データを表示する showData 関数
				function showData(pos) {
				  var str = "";                                         // データの文字列を入れる変数
				  for(var i = 0; i < pos.length; i++) {                 // 全ての特徴点（71個）について
				    str += "特徴点" + i + ": ("
				         + Math.round(pos[i][0]) + ", "                 // X座標（四捨五入して整数に）
				         + Math.round(pos[i][1]) + ")<br>";             // Y座標（四捨五入して整数に）
				  }
				  var dat = document.getElementById("dat");             // データ表示用div要素の取得
				  dat.innerHTML = str;                                  // データ文字列の表示
				}
				
				// ★スタンプを描く drawStamp 関数
// (顔部品の位置データ, 画像, 基準位置, 大きさ, 横シフト, 縦シフト)
function drawStamp(pos, img, bNo, scale, hShift, vShift) {
if(pos == false) return true; //これがないと、検知されなかった時にundefinedになる
  var eyes = pos[32][0] - pos[27][0];                   // 幅の基準として両眼の間隔を求める
  var nose = pos[62][1] - pos[33][1];                   // 高さの基準として眉間と鼻先の間隔を求める
  var wScale = eyes / img.width;                        // 両眼の間隔をもとに画像のスケールを決める
  var imgW = img.width * scale * wScale;                // 画像の幅をスケーリング
  var imgH = img.height * scale * wScale;               // 画像の高さをスケーリング
  var imgL = pos[bNo][0] - imgW / 2 + eyes * hShift;    // 画像のLeftを決める
  var imgT = pos[bNo][1] - imgH / 2 + nose * vShift;    // 画像のTopを決める
  context.drawImage(img, imgL, imgT, imgW, imgH);       // 画像を描く
}

				/*********** Code for stats **********/

				stats = new Stats();
				stats.domElement.style.position = 'absolute';
				stats.domElement.style.top = '0px';
				document.getElementById('container').appendChild( stats.domElement );

				// update stats on every iteration
				document.addEventListener('clmtrackrIteration', function(event) {
					stats.update();
				}, false);
