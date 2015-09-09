//display button labels according to item nature
function btnLabels(){	
	var text = mainBox.innerHTML.split("=").sort(function (a, b) { return b.length - a.length; })[0],		//get type
		type = text.charAt(0);
	if(type == '@'){
		decryptBtn.innerHTML = 'Unlock';
		hideBtn.disabled = false
	}else{
		decryptBtn.innerHTML = '&nbsp;Lock&nbsp;';
		hideBtn.disabled = true
	}
}

//formats results depending on tags present and sends to default email
function sendMail() {
	var cipherstr = mainBox.innerHTML;
	cipherstr = cipherstr.split("=").sort(function (a, b) { return b.length - a.length; })[0].replace(/-/g,'');		//remove tags
	var type = cipherstr.slice(0,1);
	
	var hashTag = encodeURIComponent(mainBox.innerHTML.replace(/-/g,'')).replace(/%3Cbr%3E/g,'%0D%0A');		//item ready for link
	var linkText = "Click the link below if you wish to process this automatically using the web app (the app will open in a new tab), or simply copy it and paste it into URSA:%0D%0A%0D%0Ahttps://passlok.com/ursa#" + hashTag;
	
	if (type=="@"){
		var link = "mailto:"+ "?subject= " + "&body=Message locked with URSA v.4.0 %0D%0A%0D%0AUnlock with shared Key.%0D%0A%0D%0A" + linkText;
	} else {
		mainMsg.innerHTML = "A valid locked item must be in the box before it can be emailed"
	}

	if(isMobile){ 	 											//new window for PC, same window for mobile
		window.open(link,"_parent")
	} else {
		window.open(link,"_blank")
	}
}

//calls texting app (works on mobile only)
function sendSMS(){
	if(isMobile){
		var text = "";
    	if (window.getSelection) {
        	text = window.getSelection().toString();
    	} else if (document.selection && document.selection.type != "Control") {
        	text = document.selection.createRange().text;
    	}
		if (text == ''){
			mainMsg.innerHTML = 'Please copy the item to be texted and tap SMS again';
			throw ('no selection')
		}
		window.open("SMS:","_parent")							//open SMS on mobile
	} else {
		mainMsg.innerHTML = 'SMS function is only available on mobile devices'
	}
};

//decrypts a chat invite if found, then open chat screen, otherwise make one. If the chat screen is open, returns to it
function Chat(){
	if(document.getElementById('chatFrame').src.match('#')){			//chat already open, so open that screen
		chatScr.style.display = 'block';
		return
	}
	var text = mainBox.innerHTML.trim();	
	if(text.slice(6,10) == 'chat'){										//there is already a chat invitation, so open it
		lockUnlock();
		return
	}
	openClose('shadow');
	openClose('chatDialog');												//stop to get chat type
}

//continues making a chat invite after the user has chosen the chat type
function makeChat(){
	closeChat();
	if(dataChat.checked){
		var type = 'A'
	}else if (audioChat.checked){
		var type = 'B'
	}else{
		var type = 'C'
	}
	var date = chatDate.value;
	if(date.trim() == '') date = 'noDate';
	while(date.length < 43) date += ' ';
	var password = nacl.util.encodeBase64(nacl.randomBytes(32)).replace(/=+$/,'');
	var chatRoom = makeChatRoom();
	mainBox.innerHTML = date + type + chatRoom + password;
	Encrypt();
	mainBox.innerHTML = mainBox.innerHTML.replace(/URSA40msg/g,'URSA40chat');			//change the tags
	mainMsg.innerHTML = 'Invitation to chat in the box.<br>Send it to the recipients.'
}

//makes a mostly anonymous chatRoom name from words on the blacklist
function makeChatRoom(){
	var blacklist = blackListExp.toString().slice(1,-2).split('|');
	name = replaceVariants(blacklist[randomBlackIndex()]);
		//75% chance to add a second word
	if(Math.floor(Math.random()*4)) name = name + ' ' + replaceVariants(blacklist[randomBlackIndex()]);
	while(name.length < 20) name += ' ';
	return name
}

//to open chat window once invitation is decrypted
function openChat(){
	var typetoken = mainBox.innerHTML;
	if (typetoken.length == 107){											//chat invite detected, so open chat
		mainBox.innerHTML = '';
		var date = typetoken.slice(0,43).trim();				//the first 43 characters are for the date and time etc.
		if(date != 'noDate'){
			var msgStart = "This chat invitation says:\n\n" + date + "\n\n"
		}else{
			var msgStart = ""
		}
		var reply = confirm(msgStart + "If you go ahead, the chat session will open now.\nWARNING: this involves going online, which might give away your location.");
		if(!reply){
			mainBox.innerHTML = '';
			throw("chat start canceled");
		}
		if(isSafari || isIE || isiOS){
			mainMsg.innerHTML = 'Sorry, but chat is not yet supported by your browser or OS';
			throw('browser does not support webRTC')
		}
		main2chat(typetoken.slice(43));
	}
}

//replaces back variant characters, opposite of reduceVariants
function replaceVariants(string){
	return string.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g')
}

//returns a random index for blacklist, excluding disallowed indices
function randomBlackIndex(){
	var index = 1;
	while(index == 1 || index == 2){						//excluded indices
		index = Math.floor(Math.random()*blackLength);
	}
	return index
}