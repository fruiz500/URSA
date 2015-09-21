//this starts when an item is pasted
function unlockItem(){
	mainMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';
	setTimeout(function(){
		var text = XSSfilter(mainBox.innerHTML).trim().replace(/&[^;]+;/g,'').replace(/\s/g,'');	//remove HTML tags that might have been introduced and extra spaces
		text = text.split("=").sort(function (a, b) { return b.length - a.length; })[0];			//remove tags												

		if(text.match('\u2004') || text.match('\u2005') || text.match('\u2006')){			//detect special hiding characters
			fromLetters(text);
			Decrypt()
		}else if(text.slice(0,1) == '@'){													//detect encrypted item
			Decrypt()
		}else{
			mainMsg.innerHTML = 'Text loaded'
		}
		btnLabels()
	},20);
}

//function that starts it all when the Lock/Unlock button is pushed
function lockUnlock(){
	mainMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';				//Get blinking message started
	setTimeout(function(){																		//the rest after a 20 ms delay
		Decrypt();
	},20);						//end of timeout
};

//Encryption process
function Encrypt(){
	var nonce = nacl.randomBytes(9),
		nonce24 = makeNonce24(nonce),
		noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
		text = encodeURI(mainBox.innerHTML).replace(/%20/g,' ')

	var sharedKey = wiseHash(pwd.value.trim(),noncestr);		//use the nonce for stretching the user-supplied Key
	var cipherstr = PLencrypt(text,nonce24,sharedKey);
	mainBox.innerHTML = "URSA40msg=@" + noncestr + cipherstr + "=URSA40msg";		

	mainMsg.innerHTML = 'Locking successful. Click <strong>Email</strong> or copy and send.';
	if(!isMobile) selectMain();
	btnLabels();
};

//decryption process. Calls Encrypt as appropriate
function Decrypt(){
	mainMsg.innerHTML = "";
	var keystr = pwd.value.trim(),
		cipherstr = XSSfilter(mainBox.innerHTML.trim().replace(/&[^;]+;/g,'').replace(/\s/g,''));	//remove HTML tags that might have been introduced and extra spaces
	if (cipherstr == ""){
		mainMsg.innerHTML = 'Nothing to lock or unlock';
		throw("main box empty");
	}
	cipherstr = cipherstr.split("=").sort(function (a, b) { return b.length - a.length; })[0];				//remove tags												

	if(cipherstr.slice(0,1) != '@'){									//if not encrypted yet, encrypt now
		Encrypt();
		return
	}
	
	cipherstr = cipherstr.replace(/[^a-zA-Z0-9+\/ ]+/g, '');					//remove anything that is not base64

	if (keystr == ''){
		mainMsg.innerHTML = '<span style="color:orange">Enter shared Key</span>';
		throw("symmetric key empty");
	}
	var	noncestr = cipherstr.slice(0,12),
		nonce24 = makeNonce24(nacl.util.decodeBase64(noncestr));
	cipherstr = cipherstr.slice(12);

	var sharedKey = wiseHash(keystr,noncestr);						//real shared Key

	try{
		var plain = PLdecrypt(cipherstr,nonce24,sharedKey);
		if(!plain) failedDecrypt();
		mainBox.innerHTML = decodeURI(plain).trim();
	}catch(err){failedDecrypt()};
	
	mainMsg.innerHTML = 'Unlock successful';
	btnLabels();
	openChat();
}

//extracts locked item from a piece of text
function extractCipher(string){
	var cipherstr = XSSfilter(string.replace(/&[^;]+;/g,'').replace(/\s/g,''));
	if(cipherstr.match('=(.*)=')) cipherstr = cipherstr.match('=(.*)=')[1];		//remove URL and text around item
	var	firstChar = cipherstr.charAt(0);
	if(firstChar == '@'){ return cipherstr }
	else {return ''}
}