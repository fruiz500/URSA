// initialize things
window.onload = function() {

  //event listeners for buttons etc.
	window.addEventListener('resize',textheight);

    mainFile.addEventListener('change', loadFileAsURL);
	mainFile.addEventListener('click', function(){this.value = '';});
	
	imgFile.addEventListener('change', loadImage);
	imgFile.addEventListener('click', function(){this.value = '';});
	
	imageFile.addEventListener('change', importImage);
	imageFile.addEventListener('click', function(){this.value = ''; imageOrEmail()});

   	showKey.addEventListener('click', showsec);

	selectMainBtn.addEventListener('click', selectMain);

   	clearMainBtn.addEventListener('click', clearMain);

   	decryptBtn.addEventListener('click', lockUnlock);

   	niceEditBtn.addEventListener('click', toggleRichText);
	
	image2mainBtn.addEventListener('click', image2main);
	
	encodePNGBtn.addEventListener('click', encode);

	encodeJPGBtn.addEventListener('click', encode);

   	chatBtn.addEventListener('click', Chat);

   	sendSMSBtn.addEventListener('click', sendSMS);
	
	fileMode.addEventListener('click', toggleFileOptions);

	hideBtn.addEventListener('click', textStego);

	helpBtn.addEventListener('click', main2help);

	help2mainBtnTop.addEventListener('click', main2help);

	help2mainBtnBottom.addEventListener('click', main2help);

   	sendSMSBtn.addEventListener('click', sendSMS);

   	cancelChatBtn.addEventListener('click', closeChat);

   	submitChatBtn.addEventListener('click', makeChat);

   	mainBox.addEventListener('keyup', btnLabels);

	mainBox.addEventListener('paste', pasteItem);
	function pasteItem() {setTimeout(function(){unlockItem();}, 0);}

	swapBtn.addEventListener('click', swapBoxes);

	suggestKeyBtn.addEventListener('click', suggestKey);

   	randomBtn.addEventListener('click', randomToken);

	clearKeyBtn.addEventListener('click', function() {pwd.textContent = ''; if(showKey.checked) showKey.click();});

	cancelCoverBtn.addEventListener('click', cancelCover);

	acceptCoverBtn.addEventListener('click', textStego);

	pwd.addEventListener('keyup', function(event) {pwdKeyup(event)}, false);

//for the rich text editor boxes and buttons
	formatBlock.addEventListener("change", function() {formatDoc('formatBlock',this[this.selectedIndex].value);this.selectedIndex=0;});
	fontName.addEventListener("change", function() {formatDoc('fontName',this[this.selectedIndex].value);this.selectedIndex=0;});
	fontSize.addEventListener("change", function() {formatDoc('fontSize',this[this.selectedIndex].value);this.selectedIndex=0;});
	foreColor.addEventListener("change", function() {formatDoc('foreColor',this[this.selectedIndex].value);this.selectedIndex=0;});
	backColor.addEventListener("change", function() {formatDoc('backColor',this[this.selectedIndex].value);this.selectedIndex=0;});

	document.images[1].addEventListener("click", function() {formatDoc('bold')});
	document.images[2].addEventListener("click", function() {formatDoc('italic')});
	document.images[3].addEventListener("click", function() {formatDoc('underline')});
	document.images[4].addEventListener("click", function() {formatDoc('strikethrough')});
	document.images[5].addEventListener("click", function() {formatDoc('subscript')});
	document.images[6].addEventListener("click", function() {formatDoc('superscript')});
	document.images[7].addEventListener("click", function() {formatDoc('justifyleft')});
	document.images[8].addEventListener("click", function() {formatDoc('justifycenter')});
	document.images[9].addEventListener("click", function() {formatDoc('justifyright')});
	document.images[10].addEventListener("click", function() {formatDoc('justifyfull')});
	document.images[11].addEventListener("click", function() {formatDoc('insertorderedlist')});
	document.images[12].addEventListener("click", function() {formatDoc('insertunorderedlist')});
	document.images[13].addEventListener("click", function() {formatDoc('formatBlock','blockquote')});
	document.images[14].addEventListener("click", function() {formatDoc('outdent')});
	document.images[15].addEventListener("click", function() {formatDoc('indent')});
	document.images[16].addEventListener("click", function() {formatDoc('inserthorizontalrule')});
	document.images[17].addEventListener("click", function() {var sLnk=prompt('Write the URL here','http:\/\/');if(sLnk&&sLnk!=''&&sLnk!='http://'){formatDoc('createlink',sLnk)}});
	document.images[18].addEventListener("click", function() {formatDoc('unlink')});
	document.images[19].addEventListener("click", function() {formatDoc('removeFormat')});
	document.images[20].addEventListener("click", function() {formatDoc('undo')});
	document.images[21].addEventListener("click", function() {formatDoc('redo')});

//for the help screens
	var helpHeaders = document.getElementsByClassName("helpHeading");		//add listeners to all the help headers

	for (var i = 0; i < helpHeaders.length; i++) {
		helpHeaders[i].addEventListener('click', openHelp);
	}
	
	var helpHeaders2 = document.getElementsByClassName("helpHeading2");		//2nd level help
	
	for (var i = 0; i < helpHeaders2.length; i++) {
		helpHeaders2[i].addEventListener('click', openHelp2);
	}

//fixes after inline styles were moved to css file
	mainScr.style.display = 'block';
	showKey.src = eyeImg;
};

if(window.location.hash.length > 1){
	mainBox.textContent = window.location.hash.slice(1);			//correspondent's message from address bar
	btnLabels();
	mainMsg.textContent = 'Enter the shared Key in the top box and click Decrypt'
}

//this one is for mobile only. Remove for the Chrome app
if(isMobile){
	window.addEventListener('load', function() {
		FastClick.attach(document.body);
	}, false);
}

var time10 = hashTime10();													//get milliseconds for 10 wiseHash at iter = 10

//end of body script.