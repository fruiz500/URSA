//this starts when an item is pasted
function unlockItem(){
	mainMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';
	setTimeout(function(){
		var text = XSSfilter(mainBox.innerHTML).trim().replace(/&[^;]+;/g,'');				//remove HTML tags that might have been introduced
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
	var keystr = pwd.value.trim(),
		nonce = nacl.randomBytes(9),
		nonce24 = makeNonce24(nonce),
		noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
		text = encodeURI(mainBox.innerHTML).replace(/%20/g,' ');
	if (text == ""){
		mainMsg.innerHTML = 'Nothing to lock or unlock';
		throw("main box empty");
	}
	else if(keystr.length*entropyPerChar > (text.length+9)*8 && keystr.length > 43){		//special mode for long keys, first cut
		if(entropycalc(keystr) > (text.length+9)*8){										//more proper entropy test, conservative
			padEncrypt();
			return
		}
	}

	var sharedKey = wiseHash(keystr,noncestr);		//use the nonce for stretching the user-supplied Key
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
	else if(cipherstr.slice(0,2) == '@@' && keystr.length > 43){padDecrypt();return}		//special mode for long keys

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

var entropyPerChar = 1.58;			//expected entropy of the key text in bits per character, from Shannon, as corrected by Guerrero; for true random UTF8 text this value is 8
//function for encrypting with long key
function padEncrypt(){
	var nonce = nacl.randomBytes(9),
		noncestr = nacl.util.encodeBase64(nonce).replace(/=+$/,''),
		text = LZString.compressToBase64(mainBox.innerHTML.trim()),
		keyText = pwd.value.trim();

	var textBin = nacl.util.decodeBase64(text),
		keyTextBin = nacl.util.decodeUTF8(keyText),
		keyLengthNeed = Math.ceil((textBin.length + 9) * 8 / entropyPerChar);
	if(keyLengthNeed > keyTextBin.length){
		mainMsg.innerHTML = "The key Text is too short";
		throw('key text too short')
	}
	while(isNaN(startIndex) || startIndex < 0 || startIndex > keyTextBin.length){
		var reply = prompt("Pad mode in use.\nPlease enter the position in the key text where we should start (0 to " + keyTextBin.length + ")",0);
		if(reply == null){return}else{var startIndex = parseInt(reply)}
	}
	
	var cipherBin = padResult(textBin, keyTextBin, nonce, startIndex);
	var cipherstr = nacl.util.encodeBase64(cipherBin).replace(/=/g,'');
	var macstr = padMac(textBin, keyTextBin, nonce, startIndex);
	mainBox.innerHTML = "URSA40msg=@@" + noncestr + macstr + cipherstr + "=URSA40msg";

	mainMsg.innerHTML = 'Locking successful. Click <strong>Email</strong> or copy and send.';
	if(!isMobile) selectMain();
	btnLabels();
}

//takes binary inputs and returns binary output. Same code for encrypt and decrypt
function padResult(textBin, keyTextBin, nonce, startIndex){
	var keyLength = Math.ceil(textBin.length * 8 / entropyPerChar);
	var keyBin = new Uint8Array(keyLength),
		i;
	if(startIndex + keyLength <= keyTextBin.length){								//fits without wrapping
		for(i = 0; i < keyLength; i++){
			keyBin[i] = keyTextBin[startIndex + i]
		}
	}else{																					//wrapping needed
		for(i = 0; i < keyTextBin.length - startIndex; i++){
			keyBin[i] = keyTextBin[startIndex + i]
		}
		for(i = 0; i < keyLength - (keyTextBin.length - startIndex); i++){
			keyBin[keyTextBin.length - startIndex + i] = keyTextBin[i]
		}
	}
	
	//now take a whole bunch of hashes of the encoded key Text, in 64-byte groups and using the nonce and an index, to make the keystream
	var count = Math.ceil(textBin.length / 64),
		keyStream = new Uint8Array(count * 64);	
	for(var index = 0; index < count; index++){
		var indexBin = nacl.util.decodeUTF8(index);
		var inputArray = new Uint8Array(keyBin.length + nonce.length + indexBin.length);
		//now concatenate the arrays
		for(i = 0; i < keyBin.length; i++){
			inputArray[i] = keyBin[i]
		}
		for(i = 0; i < nonce.length; i++){
			inputArray[keyBin.length + i] = nonce[i]
		}
		for(i = 0; i < indexBin.length; i++){
			inputArray[keyBin.length + nonce.length + i] = indexBin[i]
		}		
		var hash = nacl.hash(inputArray);			//finally take the hash
		for(i = 0; i < 64; i++){
			keyStream[index*64 + i] = hash[i]
		}
	}
	
	//and finally XOR the keystream and the text
	var cipherBin = new Uint8Array(textBin.length);
	for(i = 0; i < textBin.length; i++){
		cipherBin[i] = textBin[i] ^ keyStream[i]
	}
	return cipherBin
}

//makes a 9-byte message authentication code; becomes 12 chars in Base64
function padMac(textBin, keyTextBin, nonce, startIndex){					//startIndex is the one from the prompt
	var textKeyLength = Math.ceil(textBin.length * 8 / entropyPerChar),
		macKeyLength = Math.ceil(9 * 8 / entropyPerChar);
	var macBin = new Uint8Array(textBin.length + macKeyLength + nonce.length),
		i;
	var macStartIndex = (startIndex + textKeyLength) % keyTextBin.length		//mod because it may have wrapped
	
	//now add a sufficient part of the key text to obfuscate 9 bytes
	if(macStartIndex + macKeyLength <= keyTextBin.length){								//fits without wrapping
		for(i = 0; i < macKeyLength; i++){
			macBin[i] = keyTextBin[macStartIndex + i]
		}
	}else{																					//wrapping needed
		for(i = 0; i < keyTextBin.length - macStartIndex; i++){
			macBin[i] = keyTextBin[macStartIndex + i]
		}
		for(i = 0; i < macKeyLength - (keyTextBin.length - macStartIndex); i++){
			macBin[keyTextBin.length - macStartIndex + i] = keyTextBin[i]
		}
	}
	//now add the nonce
	for(i = 0; i < nonce.length; i++){
		macBin[macKeyLength + i] = nonce[i]
	}	
	//finish adding the plaintext. The rest will be left as zeroes
	for(i = 0; i < textBin.length; i++){
		macBin[macKeyLength + nonce.length + i] = textBin[i]
	}
	
	//take the SHA512 hash and return the first 12 Base64 characters
	return nacl.util.encodeBase64(nacl.hash(macBin)).slice(0,12)
}

//for decrypting with long key
function padDecrypt(){
	mainMsg.innerHTML = "";
	var keyText = pwd.value.trim(),
		cipherstr = XSSfilter(mainBox.innerHTML.trim().replace(/&[^;]+;/g,'').replace(/\s/g,''));	//remove HTML tags that might have been introduced and extra spaces
	if (cipherstr == ""){
		mainMsg.innerHTML = 'Nothing to lock or unlock';
		throw("main box empty");
	}
	cipherstr = cipherstr.split("=").sort(function (a, b) { return b.length - a.length; })[0];				//remove tags
	cipherstr = cipherstr.replace(/[^a-zA-Z0-9+\/ ]+/g, '');					//remove anything that is not base64

	if (keyText == ''){
		mainMsg.innerHTML = '<span style="color:orange">Enter shared Key</span>';
		throw("symmetric key empty");
	}
	var	noncestr = cipherstr.slice(0,12),
		nonce = nacl.util.decodeBase64(noncestr),
		macstr = cipherstr.slice(12,24);
	cipherstr = cipherstr.slice(24);
	try{
		var cipherBin = nacl.util.decodeBase64(cipherstr),
			keyTextBin = nacl.util.decodeUTF8(keyText);
	}catch(err){
		mainMsg.innerHTML = "This is corrupt or not locked"
	}
	if(cipherBin.length > keyTextBin.length){
		mainMsg.innerHTML = "The key Text is too short";
		throw('key text too short')
	}
	while(isNaN(startIndex) || startIndex < 0 || startIndex > keyTextBin.length){
		var reply = prompt("Pad mode in use.\nPlease enter the position in the key text where we should start (0 to " + keyTextBin.length + ")",0);
		if(reply == null){return}else{var startIndex = parseInt(reply)}
	}
	
	var plainBin = padResult(cipherBin, keyTextBin, nonce, startIndex);
	var macNew = padMac(plainBin, keyTextBin, nonce, startIndex);
	try{
		var plain = nacl.util.encodeBase64(plainBin).replace(/=/g,'');
	}catch(err){
		mainMsg.innerHTML = "Unlock has failed"
	}
	if(plain){
		plain = LZString.decompressFromBase64(plain);
		if(plain){
			if(macstr == macNew){										//check authentication
				mainBox.innerHTML = plain;
				mainMsg.innerHTML = 'Unlock successful';
			}else{
				mainMsg.innerHTML = 'Message authentication has failed';
			}
		}else{
			mainMsg.innerHTML = 'Unlock has failed';
		}
		btnLabels();
		openChat()	
	}else{
		mainMsg.innerHTML = "Unlock has failed"
	}
}