//this is the part of the javascript code that must be within the body

//detect browser and device
	var isMobile = (typeof window.orientation != 'undefined'),
		isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1,
		isFirefox = typeof InstallTrigger !== 'undefined',   						// Firefox 1.0+
		isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,       // At least Safari 3+: "[object HTMLElementConstructor]"
		isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0,								// Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
		isIE = /*@cc_on!@*/false || !!document.documentMode,						 // At least IE6
		isiPad = (navigator.userAgent.match(/iPad/i) != null),
		isiPhone = (navigator.userAgent.match(/iPhone|iPod/i) != null),
		isiOS = (isiPhone || isiPad),
		isAndroid = (isMobile && !isiOS),
		isAndroidTablet = (navigator.userAgent.match(/mobile/i) == null && isAndroid),
		isAndroidPhone = (navigator.userAgent.match(/mobile/i) != null && isAndroid),
		isFile = (window.location.protocol == 'file:');
	textheight();

//  Clear out "sorry, no JavaScript" warning and display the type of source
	showGreeting();

//clears the no JavaScript warning and displays an initial message depending on the type of source
function showGreeting(){
	var protocol = window.location.protocol,
		msgStart = "Welcome to URSA\r\n",
		msgEnd = "\r\nEnter the shared Key in the top box and the message in the bottom box";
	if(protocol == 'file:'){
		mainMsg.textContent = msgStart + 'running from a local file' + msgEnd
	}else if(protocol == 'https:'){
		mainMsg.textContent = msgStart + 'downloaded from a secure server' + msgEnd
	}else if(protocol == 'chrome-extension:'){
		mainMsg.textContent = msgStart + 'running as a Chrome app' + msgEnd
	}else{
		mainScr.style.backgroundColor = '#ffd0ff';
		mainMsg.textContent = msgStart + 'WARNING: running from an insecure source!' + msgEnd
	}
}

//resizes text boxes so they fit within the window
function textheight(){
	var	fullheight = document.documentElement.clientHeight,
		offsetheight = 380,
		toolbarheight = 52;
	if(isiPhone) offsetheight = offsetheight - 70;
	coverBox.style.height = fullheight - offsetheight + 150 + 'px';
	if(niceEditor){
		mainBox.style.height = fullheight - offsetheight - toolbarheight + 'px'
	}else{
		if(isMobile){
			if(isAndroid && !isFile){
				mainBox.style.height = fullheight - offsetheight + 40 + 'px';
			}else{
				mainBox.style.height = fullheight - offsetheight + 'px';
			}
		}else{
			mainBox.style.height = fullheight - offsetheight + 'px';
		}
	}
}

//this one is called by window.onload below
function loadFileAsURL()
{
	var fileToLoad = mainFile.files[0];

	var fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent)
	{
		var fileName = fileToLoad.name;
		var URLFromFileLoaded = fileLoadedEvent.target.result;
		if(URLFromFileLoaded.length > 2000000){
			var reply = confirm("This file is larger than 1.5MB and Chrome won't save it. Do you want to continue loading it?");
			if(!reply){
				mainMsg.textContent = 'File load canceled';
				return
			}
		}
		if(fileToLoad.type.slice(0,4) == "text"){
			if(URLFromFileLoaded.slice(0,2) == '==' && URLFromFileLoaded.slice(-2) == '=='){
				var fileLink = document.createElement("a");
				fileLink.download = fileName;
				fileLink.href = "data:," + safeHTML(URLFromFileLoaded);			//filter before adding to the DOM
				fileLink.textContent = fileName;
				mainBox.appendChild(fileLink)
			}else{
				var spacer = document.createElement("br"),
					textDiv = document.createElement("div");
				textDiv.textContent = safeHTML(URLFromFileLoaded).replace(/  /g,' &nbsp;');
				mainBox.appendChild(spacer);
				mainBox.appendChild(textDiv)
			}
		}else{
			var fileLink = document.createElement("a");
			fileLink.download = fileName;
			fileLink.href = safeHTML(URLFromFileLoaded).replace(/=+$/,'');
			fileLink.textContent = fileName;
			mainBox.appendChild(fileLink)
		}
	};
	if(fileToLoad.type.slice(0,4) == "text"){
		fileReader.readAsText(fileToLoad, "UTF-8");
		mainMsg.textContent = 'This is the content of file ' + fileToLoad.name;
	}else{
		fileReader.readAsDataURL(fileToLoad, "UTF-8");
		mainMsg.textContent = 'The file has been loaded in encoded form. It is NOT ENCRYPTED.';
	}
	setTimeout(function(){
		btnLabels();
		if(decryptBtn.textContent == 'Decrypt') mainMsg.textContent = 'This file contains an encrypted item'
	},300);
}

//to load an image into the main box
function loadImage(){
	var fileToLoad = imgFile.files[0],
		fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent){
		var URLFromFileLoaded = fileLoadedEvent.target.result;
		if(URLFromFileLoaded.slice(0,10) != 'data:image'){
			mainMsg.textContent = 'This file is not a recognized image type';
			return
		}
		var image = document.createElement("img");
		image.src = safeHTML(URLFromFileLoaded).replace(/=+$/,'');
		mainBox.appendChild(image)
	};

	fileReader.readAsDataURL(fileToLoad, "UTF-8");
}