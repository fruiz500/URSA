﻿//this starts when an item is pasted
function unlockItem(){
	mainMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';
	setTimeout(function(){
		var array = getType(mainBox.innerHTML.trim()),
			type = array[0],
			text = array[1];
		if(text.match('\u2004') || text.match('\u2005') || text.match('\u2006')){			//detect special hiding characters
			fromLetters(text);
			lockUnlock()
		}else if(type){													//detect encrypted item
			Decrypt(text)
		}else{
			mainMsg.textContent = 'Text loaded'
		}
		btnLabels()
	},20)
}

//gets recognized type of string, if any, otherwise returns false. Also returns cleaned-up string
function lockUnlock(){
	mainMsg.innerHTML = '<span class="blink" style="color:cyan">PROCESSING</span>';				//Get blinking message started
	setTimeout(function(){
	var array = getType(mainBox.innerHTML.trim());
	if(array[0]){
		Decrypt(array[1])
	}else{
		Encrypt(array[1])
	}
	},20)
}

//gets recognized type of string, if any, otherwise returns false. Also returns cleaned-up string
function getType(stringIn){
	var string = stringIn.replace(/&[^;]+;/g,'').replace(/<a(.*?).(plk|txt)" href="data:(.*?),/,'').replace(/"(.*?)\/a>/,'');
	if(string.match('==')) string = string.split('==')[1];		//remove tags
	string = string.replace(/<(.*?)>/g,'');

	var	type = string.charAt(0),
		isBase64 = !string.match(/[^a-zA-Z0-9+\/]/),
		isBase26 = !string.match(/[^A-Z]/);
	if(type.match(/[dg]/) && isBase64){
		return [true, string]
	}else if(type && isBase26){
		return [true, string]
	}else{
		return [false, stringIn]
	}
}

//Encryption process
function Encrypt(text){
	var keyStr = pwd.innerHTML.replace(/<br>$/,"").split('|')[0].trim();
	if(!keyStr){
		mainMsg.textContent = 'Enter shared Key';
		return
	}
	if (text == ""){
		mainMsg.textContent = 'Nothing to encrypt or decrypt';
		return
	}
	else if(keyStr.length*entropyPerChar > (text.length+9)*8 && keyStr.length > 43){		//special mode for long keys
		padEncrypt();
		return
	}
	if(keyStr.split(',').length == 3){														//key is three strings separated by commas: human-computable encryption
		humanEncrypt(text,true);
		return
	}		
	var	nonce = nacl.randomBytes(9),
		nonce24 = makeNonce24(nonce),
		nonceStr = nacl.util.encodeBase64(nonce);

	var sharedKey = wiseHash(keyStr,nonceStr);		//use the nonce for stretching the user-supplied Key

	var cipher = PLencrypt(text,nonce24,sharedKey,true),		//true because compression is used
		outString = nacl.util.encodeBase64(concatUint8Arrays([128],concatUint8Arrays(nonce,cipher))).replace(/=+$/,'');
	if(fileMode.checked){
		if(textMode.checked){
			mainBox.innerHTML = '<a download="URSA42msg.txt" href="data:,' + outString + '"><b>URSA 4.2 encrypted message (text file)</b></a>'
		}else{
			mainBox.innerHTML = '<a download="URSA42msg.plk" href="data:binary/octet-stream;base64,' + outString + '"><b>URSA 4.2 encrypted message (binary file)</b></a>'
		}
	}else{
		mainBox.innerHTML = "<pre>" + ("URSA42msg==" + outString + "==URSA42msg").match(/.{1,80}/g).join("<br>") + "</pre>"
	}
	mainMsg.textContent = 'Encryption successful. Copy and send.';
	btnLabels()
}

//concatenates two uint8 arrays, normally used right before displaying the output
function concatUint8Arrays(array1,array2){
	var result = new Uint8Array(array1.length + array2.length);
	result.set(array1,0);
	result.set(array2,array1.length);
	return result
}

//decryption process. Calls Encrypt as appropriate
function Decrypt(cipherStr){
	mainMsg.textContent = "";
	var keyStr = pwd.innerHTML.replace(/<br>$/,"").split('|')[0].trim();
	if(!keyStr){
		mainMsg.textContent = 'Enter shared Key';
		return
	}

	if(cipherStr.charAt(0) == 'd' && keyStr.length > 43){ 					//special mode for long keys
		padDecrypt(cipherStr);
		return

	}
	
	if(!cipherStr.match(/[^A-Z]/)){														//only base26: special human encrypted mode
		if(pwd.textContent.split(',').length != 3){
			mainMsg.textContent = 'Please supply a correct Key for human decryption: three strings separated by commas';
			return
		}
		humanEncrypt(cipherStr,false);													//when set to false the process decrypts
		return
	}

	if(cipherStr.length != 160) var isCompressed = true;						//compression unless it's a PassLok short message

	var fullArray = nacl.util.decodeBase64(cipherStr),
		nonce = fullArray.slice(1,10),
		nonce24 = makeNonce24(nonce),
		cipher = fullArray.slice(10);

	var sharedKey = wiseHash(keyStr,nacl.util.encodeBase64(nonce));						//real shared Key

	var plain = PLdecrypt(cipher,nonce24,sharedKey,isCompressed);
	if(isCompressed){
			mainBox.innerHTML = safeHTML(plain.trim())
	}else{																//PassLok short mode
			mainBox.innerHTML = safeHTML(decodeURI(plain).trim())
	}

	mainMsg.textContent = 'Decryption successful';
	btnLabels();
	openChat()
}

var entropyPerChar = 1.58;			//expected entropy of the key text in bits per character, from Shannon, as corrected by Guerrero; for true random UTF8 text this value is 8
//function for encrypting with long key
function padEncrypt(){
	var nonce = nacl.randomBytes(15),
		text = mainBox.innerHTML.trim(),
		keyText = pwd.textContent.trim();

	if(text.match('="data:')){
		var textBin = nacl.util.decodeUTF8(text)
	}else{
		var textBin = LZString.compressToUint8Array(text)
	}
	var	keyTextBin = nacl.util.decodeUTF8(keyText),
		keyLengthNeed = Math.ceil((textBin.length + 15) * 8 / entropyPerChar);
	if(keyLengthNeed > keyTextBin.length){
		mainMsg.textContent = "The key Text is too short";
		throw('key text too short')
	}
	while(isNaN(startIndex) || startIndex < 0 || startIndex > keyTextBin.length){
		var reply = prompt("Pad mode in use.\nPlease enter the position in the key text where we should start (0 to " + keyTextBin.length + ")",0);
		if(reply == null){return}else{var startIndex = parseInt(reply)}
	}
	
	var cipherBin = padResult(textBin, keyTextBin, nonce, startIndex),
		macBin = padMac(textBin, keyTextBin, nonce, startIndex),
		outStr = nacl.util.encodeBase64(concatUint8Arrays([116],concatUint8Arrays(nonce,concatUint8Arrays(macBin,cipherBin)))).replace(/=+$/,'');
	if(fileMode.checked){
		if(textMode.checked){
			mainBox.innerHTML = '<a download="URSA42msp.txt" href="data:,' + outStr + '"><b>URSA 4.2 Pad encrypted message (text file)</b></a>'
		}else{
			mainBox.innerHTML = '<a download="URSA42msp.plk" href="data:binary/octet-stream;base64,' + outStr + '"><b>URSA 4.2 Pad encrypted message (binary file)</b></a>'
		}
	}else{
		mainBox.innerHTML = "<pre>" + ("URSA42msp==" + outStr + "==URSA42msp").match(/.{1,80}/g).join("<br>") + "</pre>"
	}
	mainMsg.innerHTML = 'Encryption successful. Click <strong>Email</strong> or copy and send.';
	btnLabels()
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

//makes a 16-byte message authentication code; becomes 12 chars in Base64
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
	
	//take the SHA512 hash and return the first 16 bytes
	return nacl.hash(macBin).slice(0,16)
}

//for decrypting with long key
function padDecrypt(cipherStr){
	mainMsg.textContent = "";
	var keyText = pwd.textContent.trim();

	if (keyText == ''){
		mainMsg.textContent = 'Click Enter and enter long shared Key, then try again';
		throw("symmetric key empty")
	}
	try{
		var inputBin = nacl.util.decodeBase64(cipherStr),
			keyTextBin = nacl.util.decodeUTF8(keyText);
		if(cipherStr.length == 160){									//short mode message, for compatibility with PassLok
			var	nonce = inputBin.slice(1,10),
				macBin = inputBin.slice(10,26),
				cipherBin = inputBin.slice(26)
		}else{
			var nonce = inputBin.slice(1,16),							//ignore the indicator byte
				macBin = inputBin.slice(16,32),
				cipherBin = inputBin.slice(32)
		}

	}catch(err){
		mainMsg.textContent = "This is corrupt or not encrypted"
	}
	if(cipherBin.length > keyTextBin.length){
		mainMsg.textContent = "The key Text is too short";
		throw('key text too short')
	}
	while(isNaN(startIndex) || startIndex < 0 || startIndex > keyTextBin.length){
		var reply = prompt("Pad mode in use.\nPlease enter the position in the key text where we should start (0 to " + keyTextBin.length + ")",0);
		if(reply == null){return}else{var startIndex = parseInt(reply)}
	}
	
	var plainBin = padResult(cipherBin, keyTextBin, nonce, startIndex),
		macNew = padMac(plainBin, keyTextBin, nonce, startIndex);
	
	try{
		if(cipherStr.length == 160){
			var plain = decodeURI(nacl.util.encodeUTF8(plainBin)).trim()
		}else{
			if(plainBin.join().match(",61,34,100,97,116,97,58,")){
				var plain = nacl.util.encodeUTF8(plainBin)
			}else{
				var plain = LZString.decompressFromUint8Array(plainBin)
			}
		}
	}catch(err){
		mainMsg.textContent = "Decryption has failed"
	}
	if(plain){
		var macChecks = true;
		for(var i = 0; i < 16; i++){
			macChecks = macChecks && (macBin[i] == macNew[i])
		}
		if(macChecks){																//check authentication
			mainBox.innerHTML = safeHTML(plain);
			mainMsg.textContent = 'Decryption successful';
		}else{
			mainMsg.textContent = 'Message authentication has failed';
		}
		openChat()														//in case it was an encrypted chat
	}else{
		mainMsg.textContent = "Decryption has failed"
	}
	btnLabels()
}

//now for human-computable encryption
var	base26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	
//makes the scrambled alphabet, starting from a string
function makeAlphabet(string){
	var result = '', alpha = "ZYXWVUTSRQPONMLKJIHGFEDCBA",
		stringLength = string.length;
	if(stringLength != 0){
		for(var i = 0; i < stringLength; i++){
			var letter = string.charAt(i);
			if(result.indexOf(letter) == -1){			//letter not picked yet
				result += letter;
				var reg = new RegExp(letter);
				alpha = alpha.replace(reg,'')
			}else{										//letter was picked, so take first letter before it in the alphabet that is still available
				var index = base26.indexOf(letter),
					alphaLength = alpha.length;
				for(var j = 0; j < alphaLength; j++){
					if(base26.indexOf(alpha.charAt(j)) < index){
						result += alpha.charAt(j);
						alpha = alpha.slice(0,j) + alpha.slice(j+1,alphaLength);
						break
					}else if(j == alphaLength - 1){
						result += alpha.charAt(0);
						alpha = alpha.slice(1)
					}
				}
			}
		}
		var base26B = result + alpha
	}else{
		var base26B = base26							//use straight alphabet if the key is empty
	}
	var base26Barray = new Array(26),
		base26Binverse = new Array(26);
	for(var i = 0; i < 26; i++){
		base26Barray[i] = base26.indexOf(base26B.charAt(i));
		base26Binverse[i] = base26B.indexOf(base26.charAt(i))
	}
	return [base26Barray,base26Binverse]
}

//to remove accents etc.
String.prototype.removeDiacritics = function() {
    var diacritics = [
        [/[\300-\306]/g, 'A'],
        [/[\340-\346]/g, 'a'],
        [/[\310-\313]/g, 'E'],
        [/[\350-\353]/g, 'e'],
        [/[\314-\317]/g, 'I'],
        [/[\354-\357]/g, 'i'],
        [/[\322-\330]/g, 'O'],
        [/[\362-\370]/g, 'o'],
        [/[\331-\334]/g, 'U'],
        [/[\371-\374]/g, 'u'],
        [/[\321]/g, 'N'],
        [/[\361]/g, 'n'],
        [/[\307]/g, 'C'],
        [/[\347]/g, 'c'],
		 [/[\337]/g, 'ss'],
    ];
    var s = this;
    for (var i = 0; i < diacritics.length; i++) {
        s = s.replace(diacritics[i][0], diacritics[i][1]);
    }
    return s;
}

//processes plaintext or ciphertext and does encryption (decryption if isEncrypt = false)
function humanEncrypt(text,isEncrypt){
	text = text.replace(/(<br>|<div>)/g,' ').replace(/<(.*?)>/g,'');																		//no tags allowed. pure text
	if(text.trim() == '') return;
	
	//text preparation. If encrypting, convert Qs into Ks and then spaces into Qs. Punctuation other than commas into QQ
	if(isEncrypt){
		text = text.replace(/[0-9]/g,function(match){return base26.charAt(match);}).trim();						//replace numbers with letters
		text = text.toUpperCase().removeDiacritics();																//remove accents and make upper case
		text = text.replace(/Q/g,'K').replace(/[.;:!?{}_()\[\]…—–―\-\s\n]/g,'Q').replace(/Q+$/,'')				//turn Q into K, spaces and punctuation into Q
	}
	text = text.replace(/[^A-Z]/g,'');																				//only base26 anyway

	var rawKeys = pwd.textContent.split(',');
	for(var i = 0; i < 3; i++) rawKeys[i] = rawKeys[i].toUpperCase().removeDiacritics().replace(/[^A-Z]/g,'');	//remove accents, spaces, and all punctuation

	var	base26B1arrays = makeAlphabet(compressKey(rawKeys[0],25)),
		base26B2arrays = makeAlphabet(compressKey(rawKeys[1],25)),
		base26BArray1 = base26B1arrays[0],
		base26BArray2 = base26B2arrays[0],
		base26Binverse1 = base26B1arrays[1],
		base26Binverse2 = base26B2arrays[1],
		seed = rawKeys[2] ? rawKeys[2] : rawKeys[0];			//if seed is empty, use key 1

	var seedLength = seed.length;
	seedArray = new Array(seedLength);
	for(var i = 0; i < seedLength; i++){
		seedArray[i] = base26.indexOf(seed.charAt(i))
	}

	var	rndSeedArray = new Array(seedLength);	
	if(isEncrypt){										//per-message random seed if so chosen
		var	dummySeed = '',
			newIndex;
		for(var i = 0; i < seedLength; i++){
			newIndex = Math.floor(Math.random()*26);
			rndSeedArray[i] = newIndex;					//this contains the random seed		
			dummySeed += base26.charAt(newIndex)
		}
		text = dummySeed + text
	}		
		
	var	length = text.length,
		textArray = new Array(length),
		cipherArray = new Array(length);

	//now fill row 1 with numbers representing letters; this will be a lot faster than doing string operations
	for(var i = 0; i < length; i++){
		textArray[i] = base26.indexOf(text.charAt(i))
	}
	
	//if decrypting, extract the random seed
	if(!isEncrypt){
		for(var i = 0; i < seedLength; i++) rndSeedArray[i] = base26BArray2[(26 - base26Binverse1[textArray[i]] + seedArray[i]) % 26]
	}
	
	//main calculation. First make the keystream
	var stream = new Array(length);
	for(var i = 0; i < seedLength; i++){
		stream[i] = rndSeedArray[i]
	}
	for(var i = seedLength; i < length; i++){
		stream[i] = base26BArray1[(26 - base26Binverse2[stream[i-seedLength]] + stream[i-seedLength+1]) % 26]
	}
	stream = seedArray.concat(stream.slice(seedLength));											//replace random seed with original seed before the final operation

	//now combine the plaintext (ciphertext) and the keystream using the Tabula Prava, and convert back to letters
	for(var i = 0; i < length; i++) cipherArray[i] = isEncrypt ? base26.charAt(base26BArray1[(26 - base26Binverse2[textArray[i]] + stream[i]) % 26]) : base26.charAt(base26BArray2[(26 - base26Binverse1[textArray[i]] + stream[i]) % 26]);
	var cipherText = cipherArray.join('');

	if(!isEncrypt){
		cipherText = cipherText.slice(seedLength);										//remove dummy seed when decrypting
		cipherText = cipherText.replace(/QQ/g,'. ').replace(/Q/g,' ').replace(/KU([AEIO])/g,'QU$1')
	}

	if(!isEncrypt){
		mainBox.innerHTML = cipherText
	}else{
		if(fileMode.checked){
			if(textMode.checked){
				mainBox.innerHTML = '<a download="URSA42msh.txt" href="data:,' + cipherText + '"><b>URSA 4.2 Human encrypted message (text file)</b></a>'
			}else{
				mainBox.innerHTML = '<a download="URSA42msh.plk" href="data:binary/octet-stream;base64,' + cipherText + '"><b>URSA 4.2 Human encrypted message (binary file)</b></a>'
			}
		}else{
			mainBox.innerHTML = "<pre>" + ("URSA42msh==" + cipherText + "==URSA42msh").match(/.{1,80}/g).join("<br>") + "</pre>"
		}
	}
	if(isEncrypt){
		mainMsg.textContent = 'Human encryption done. Recipients can decrypt this by hand'
	}else{
		mainMsg.textContent = 'Human decryption done. Numbers turned into characters. Commas lost. Other punctuation rendered as periods'
	}
	btnLabels()
}

//makes a high-entropy base26 key of a given length from a piece of regular text
function compressKey(string,length){
	var indexArray = new Array(string.length),
		outputArray = new Array(length),
		rows = Math.ceil(string.length / length),
		outStr = '';
	
	for(var i = 0; i < string.length; i++) indexArray[i] = base26.indexOf(string.charAt(i));		//turn into index array

	for(var i = 0; i < length; i++){	
		if(indexArray[i] != undefined) outputArray[i] = indexArray[i];									//do serpentine operations so long as there is more key material
		for(var j = 1; j < rows; j++){
			if(indexArray[i + length * j] != undefined) outputArray[i] = (26 - outputArray[i] + indexArray[i + length * j]) % 26
		}
	}
	
	for(var i = 0; i < length; i++) if(outputArray[i] != undefined) outStr += base26.charAt(outputArray[i]);
	return outStr
}