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

//calls texting app
function sendSMS(){
	if(sendSMSBtn.textContent == 'Save'){
		saveFiles()
	}else{
		selectMain();
		window.open("SMS:","_parent")
	}
}

//decrypts a chat invite if found, then open chat screen, otherwise make one. If the chat screen is open, returns to it
function Chat(){
	var text = mainBox.textContent.trim();
	if(!pwd.value.trim()){
		mainMsg.textContent = "Please write in a Key before clicking Chat";
		return
	}
	if(text.match('==') && text.split('==')[0].slice(-4) == 'chat'){		//there is already a chat invitation, so open it
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
	if(dataChat.checked){					//A to C for Muaz Khan's WebRTC chat, D for Jitsi
		var type = 'A'
	}else if (audioChat.checked){
		var type = 'B'
	}else if (videoChat.checked){
		var type = 'C'
	}else{
		var type = 'D'
	}
	var date = chatDate.value;
	if(date.trim() == '') date = 'noDate';
	while(date.length < 43) date += ' ';
	var password = nacl.util.encodeBase64(nacl.randomBytes(32)).replace(/=+$/,'');
	var chatRoom = makeChatRoom();
	Encrypt(date + type + chatRoom + '?' + password);
	mainBox.textContent = mainBox.textContent.replace(/URSA42msg/g,'URSA42chat');			//change the tags
	mainMsg.textContent = 'Invitation to chat in the box.\nSend it to the recipients.'
}

//makes a mostly anonymous chatRoom name from four words in the wordlist
function makeChatRoom(){
	var wordlist = wordListExp.toString().slice(1,-2).split('|'),
		name = '';
	for(var i = 0; i < 4; i++){
		name += capitalizeFirstLetter(replaceVariants(wordlist[randomIndex()]))
	}
	return name
}

//replaces back variant characters, opposite of reduceVariants
function replaceVariants(string){
	return string.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g')
}

//capitalizes first letter, the better to blend into Jitsi
function capitalizeFirstLetter(str) {
  return str[0].toUpperCase() + str.slice(1);
}

//returns a random index for wordlist
function randomIndex(){
	return Math.floor(Math.random()*wordLength)
}

//detects if there is a chat link in the main box, and opens the Chat window
function openChat(){
	var typetoken = mainBox.textContent.trim();
	if (typetoken.slice(-44,-43) == '?' && !typetoken.slice(43).match(/[^A-Za-z0-9+\/?]/)){			//chat data detected, so open chat
		mainBox.textContent = '';
		var date = typetoken.slice(0,43).trim(),									//the first 43 characters are for the date and time etc.
			chatToken = decodeURI(typetoken.slice(43));
		if(date != 'noDate'){
			var msgStart = "This chat invitation says:\n\n " + date + " \n\n"
		}else{
			var msgStart = ""
		}
		var reply = confirm(msgStart + "If you go ahead, the chat session will open now.\nWARNING: this involves going online, which might give away your location. If you cancel, a link for the chat will be made.");
		if(!reply){
			var chatLink = document.createElement('a');
			chatLink.href = 'https://passlok.com/chat/chat.html#' + chatToken;
			chatLink.textContent = 'Right-click to open the chat';
			mainBox.textContent = '';
			mainBox.appendChild(chatLink);
			return
		}
		if(isSafari || isIE || isiOS){
			mainMsg.textContent = 'Sorry, but chat is not yet supported by your browser or OS';
			return
		}
		main2chat(chatToken)
	}
}