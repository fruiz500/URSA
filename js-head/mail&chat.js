//formats results depending on tags present and sends to default email
function sendMail() {
	var array = getType(mainBox.innerHTML.trim());
	
	if(array[0]){
		var hashTag = encodeURIComponent(mainBox.textContent.trim()).replace(/%0A/g,'%0D%0A');		//item ready for link
		var linkText = "Click the link below if you wish to process this automatically using the web app (the app will open in a new tab), or simply copy it and paste it into URSA:%0D%0A%0D%0Ahttps://passlok.com/ursa#==" + hashTag + "==";
		var link = "mailto:"+ "?subject= " + "&body=Message encrypted with URSA v.4.2 %0D%0A%0D%0ADecrypt with shared Key.%0D%0A%0D%0A" + linkText;

		if(isMobile){ 	 											//new window for PC, same window for mobile
			window.open(link,"_parent")
		}else{
			window.open(link,"_blank")
		}
	} else {
		mainMsg.textContent = "A valid encrypted item must be in the box before it can be emailed"
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
		window.open("SMS:","_parent")							//open SMS on mobile
	} else {
		mainMsg.textContent = 'SMS function is only available on mobile devices'
	}
};

//decrypts a chat invite if found, then open chat screen, otherwise make one. If the chat screen is open, returns to it
function Chat(){
	if(document.getElementById('chatFrame').src.match('#')){			//chat already open, so open that screen
		chatScr.style.display = 'block';
		return
	}
	var text = mainBox.textContent.trim();
	if(!pwd.textContent.trim()){
		mainMsg.textContent = "Please write in a Key before clicking Chat";
		return
	}
	if(text.slice(6,10) == 'chat'){										//there is already a chat invitation, so open it
		lockUnlock();
		return
	}else{
		chatDate.value = text
	}
	shadow.style.display = "block";
	chatDialog.style.display = "block"												//stop to get chat type
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
	Encrypt(date + type + chatRoom + password);
	mainBox.textContent = mainBox.textContent.replace(/URSA42msg/g,'URSA42chat');			//change the tags
	mainMsg.textContent = 'Invitation to chat in the box.\nSend it to the recipients.'
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
	var typetoken = mainBox.textContent.trim();
	if (typetoken.length == 107 && !typetoken.slice(-43).match(' ')){
		mainBox.textContent = '';
		var date = typetoken.slice(0,43).trim();				//the first 43 characters are for the date and time etc.
		if(date != 'noDate'){
			var msgStart = "This chat invitation says:\n\n" + date + "\n\n"
		}else{
			var msgStart = ""
		}
		var reply = confirm(msgStart + "If you go ahead, the chat session will open now.\nWARNING: this involves going online, which might give away your location.");
		if(!reply){
			mainBox.textContent = '';
			return
		}
		if(isSafari || isIE || isiOS){
			mainMsg.textContent = 'Sorry, but chat is not yet supported by your browser or OS';
			return
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