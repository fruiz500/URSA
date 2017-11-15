﻿// initialize things
window.onload = function() {

	if(isMobile){
		niceEditBtn.style.display = 'none';		//no rich text editing on mobile
		mainFile.style.display = 'none';
		selectMainBtn.style.display = 'none';
	} else {
		sendSMSBtn.style.display = 'none';
	}

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
	
	fileMode.addEventListener('click', toggleFileOptions);

	hideBtn.addEventListener('click', textStego);

	helpBtn.addEventListener('click', main2help);

	help2mainBtnTop.addEventListener('click', main2help);

	help2mainBtnBottom.addEventListener('click', main2help);

   	sendSMSBtn.addEventListener('click', sendSMS);

   	closeChatBtn.addEventListener('click', chat2main);

   	resetChatBtn.addEventListener('click', resetChat);

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

	document.images[0].addEventListener("click", function() {formatDoc('bold')});
	document.images[1].addEventListener("click", function() {formatDoc('italic')});
	document.images[2].addEventListener("click", function() {formatDoc('underline')});
	document.images[3].addEventListener("click", function() {formatDoc('strikethrough')});
	document.images[4].addEventListener("click", function() {formatDoc('subscript')});
	document.images[5].addEventListener("click", function() {formatDoc('superscript')});
	document.images[6].addEventListener("click", function() {formatDoc('justifyleft')});
	document.images[7].addEventListener("click", function() {formatDoc('justifycenter')});
	document.images[8].addEventListener("click", function() {ormatDoc('justifyright')});
	document.images[9].addEventListener("click", function() {formatDoc('justifyfull')});
	document.images[10].addEventListener("click", function() {formatDoc('insertorderedlist')});
	document.images[11].addEventListener("click", function() {formatDoc('insertunorderedlist')});
	document.images[12].addEventListener("click", function() {formatDoc('formatBlock','blockquote')});
	document.images[13].addEventListener("click", function() {formatDoc('outdent')});
	document.images[14].addEventListener("click", function() {formatDoc('indent')});
	document.images[15].addEventListener("click", function() {formatDoc('inserthorizontalrule')});
	document.images[16].addEventListener("click", function() {var sLnk=prompt('Write the URL here','http:\/\/');if(sLnk&&sLnk!=''&&sLnk!='http://'){formatDoc('createlink',sLnk)}});
	document.images[17].addEventListener("click", function() {formatDoc('unlink')});
	document.images[18].addEventListener("click", function() {formatDoc('removeFormat')});
	document.images[19].addEventListener("click", function() {formatDoc('undo')});
	document.images[20].addEventListener("click", function() {formatDoc('redo')});

//for the help screens
	aa1.addEventListener('click', function() {openHelp('a1')});
	aa2.addEventListener('click', function() {openHelp('a2')});
	aa3.addEventListener('click', function() {openHelp('a3')});
	aa4.addEventListener('click', function() {openHelp('a4')});
	aa5.addEventListener('click', function() {openHelp('a5')});
	aa6.addEventListener('click', function() {openHelp('a6')});
	aa7.addEventListener('click', function() {openHelp('a7')});
	aa8.addEventListener('click', function() {openHelp('a8')});
	aa9.addEventListener('click', function() {openHelp('a9')});
	aa10.addEventListener('click', function() {openHelp('a10')});
	aa11.addEventListener('click', function() {openHelp('a11')});

	bb8.addEventListener('click', function() {openClose('b8')});

};

if(window.location.hash.length > 1){
	mainBox.textContent = window.location.hash.slice(1);			//correspondent's message from address bar
	btnLabels();
	mainMsg.textContent = 'Enter the shared Key in the top box and click Decrypt'
}
/*
//this one is for mobile only. Remove for the Chrome app
window.addEventListener('load', function() {
	FastClick.attach(document.body);
}, false);
*/
var time10 = hashTime10();													//get milliseconds for 10 wiseHash at iter = 10

//end of body script.