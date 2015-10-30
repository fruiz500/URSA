//function to test key strength and come up with appropriate key stretching. Based on WiseHash
function keyStrength(pwd,display) {
	var entropy = entropycalc(pwd);

	if(entropy == 0){
		var msg = 'This is a known <span style="color:magenta">bad Key!</span>';
	}else if(entropy < 20){
		var msg = '<span style="color:magenta">Terrible!</span>';
	}else if(entropy < 40){
		var msg = '<span style="color:red">Weak!</span>';
	}else if(entropy < 60){
		var msg = '<span style="color:orange">Medium</span>';
	}else if(entropy < 90){
		var msg = '<span style="color:green">Good!</span>';
	}else if(entropy < 120){
		var msg = '<span style="color:lime">Great!</span>';
	}else{
		var msg = '<span style="color:cyan">Overkill  !!</span>';
	}

	var iter = Math.max(1,Math.min(20,Math.ceil(24 - entropy/5)));			//set the scrypt iteration exponent based on entropy: 1 for entropy >= 120, 20(max) for entropy <= 20

	var seconds = time10/10000*Math.pow(2,iter-8);			//to tell the user how long it will take, in seconds

	if(pwd.trim()==''){
		msg = 'Enter your Key below'
	}else{
		msg = 'Key entropy: ' + Math.round(entropy*100)/100 + ' bits. ' + msg + '<br>Up to ' + Math.max(0.01,seconds.toPrecision(3)) + ' sec. to process'
	}
if(display){																//display the appropriate messages
	mainMsg.innerHTML = msg;
}
	return iter
};

//takes a string and calculates its entropy in bits, taking into account the kinds of characters used and parts that may be in the general wordlist (reduced credit) or the blacklist (no credit)
function entropycalc(pwd){

//find the raw Keyspace
	var numberRegex = new RegExp("^(?=.*[0-9]).*$", "g");
	var smallRegex = new RegExp("^(?=.*[a-z]).*$", "g");
	var capRegex = new RegExp("^(?=.*[A-Z]).*$", "g");
	var base64Regex = new RegExp("^(?=.*[/+]).*$", "g");
	var otherRegex = new RegExp("^(?=.*[^a-zA-Z0-9/+]).*$", "g");

	pwd = pwd.replace(/\s/g,'');										//no credit for spaces

	var Ncount = 0;
	if(numberRegex.test(pwd)){
		Ncount = Ncount + 10;
	}
	if(smallRegex.test(pwd)){
		Ncount = Ncount + 26;
	}
	if(capRegex.test(pwd)){
		Ncount = Ncount + 26;
	}
	if(base64Regex.test(pwd)){
		Ncount = Ncount + 2;
	}
	if(otherRegex.test(pwd)){
		Ncount = Ncount + 31;											//assume only printable characters
	}

//start by finding words that might be on the blacklist (no credit)
	var pwd = reduceVariants(pwd);
	var wordsFound = pwd.match(blackListExp);							//array containing words found on the blacklist
	if(wordsFound){
		for(var i = 0; i < wordsFound.length;i++){
			pwd = pwd.replace(wordsFound[i],'');						//remove them from the string
		}
	}

//now look for regular words on the wordlist
	wordsFound = pwd.match(wordListExp);									//array containing words found on the regular wordlist
	if(wordsFound){
		wordsFound = wordsFound.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});	//remove duplicates from the list
		var foundLength = wordsFound.length;							//to give credit for words found we need to count how many
		for(var i = 0; i < wordsFound.length;i++){
			pwd = pwd.replace(new RegExp(wordsFound[i], "g"),'');									//remove all instances
		}
	}else{
		var foundLength = 0;
	}

	pwd = pwd.replace(/(.+?)\1+/g,'$1');								//no credit for repeated consecutive character groups

	if(pwd != ''){
		return (pwd.length*Math.log(Ncount) + foundLength*Math.log(wordLength + blackLength))/Math.LN2
	}else{
		return (foundLength*Math.log(wordLength + blackLength))/Math.LN2
	}
}

//take into account common substitutions, ignore spaces and case
function reduceVariants(string){
	return string.toLowerCase().replace(/[óòöôõo]/g,'0').replace(/[!íìïîi]/g,'1').replace(/[z]/g,'2').replace(/[éèëêe]/g,'3').replace(/[@áàäâãa]/g,'4').replace(/[$s]/g,'5').replace(/[t]/g,'7').replace(/[b]/g,'8').replace(/[g]/g,'9').replace(/[úùüû]/g,'u');
}

//stretches a password string with a salt string to make a 256-bit Uint8Array Key
function wiseHash(pwd,salt){
	var iter = keyStrength(pwd,false),
		secArray = new Uint8Array(32),
		keyBytes;
	if(salt.length == 43) iter = 1;								//random salt: no extra stretching needed
	scrypt(pwd,salt,iter,8,32,0,function(x){keyBytes=x;});
	for(var i=0;i<32;i++){
			secArray[i] = keyBytes[i]
	}
	return secArray
}

//returns milliseconds for 10 scrypt runs at iter=10 so the user can know how long wiseHash will take; called at the end of body script
function hashTime10(){
	var before = Date.now();
	for (var i=0; i<10; i++){
		scrypt('hello','world',10,8,32,0,function(){});
	}
	return Date.now() - before
}

//stretches nonce to 24 bytes
function makeNonce24(nonce){
	var	result = new Uint8Array(24);
	for(i=0;i<nonce.length;i++){result[i] = nonce[i]};
	return result
}

//encrypt string with a shared Key
function PLencrypt(plainstr,nonce24,sharedKey){
	var plain = nacl.util.decodeUTF8(plainstr),
		cipher = nacl.secretbox(plain,nonce24,sharedKey);
	return nacl.util.encodeBase64(cipher).replace(/=+$/,'')
}

//decrypt string with a shared Key
function PLdecrypt(cipherstr,nonce24,sharedKey){
	var cipher = nacl.util.decodeBase64(cipherstr),
		plain = nacl.secretbox.open(cipher,nonce24,sharedKey);
		if(!plain) failedDecrypt();
	return nacl.util.encodeUTF8(plain)
}

//this strips initial and final tags, plus spaces and non-base64 characters in the middle
function striptags(string){
	string = string.replace(/\s/g,'');															//remove spaces
	string = string.split("=").sort(function (a, b) { return b.length - a.length; })[0];		//remove tags
	string = string.replace(/[^a-zA-Z0-9+\/]+/g,''); 											//takes out anything that is not base64
	return string
}

//puts an 42-character random string in the key box (not 43 so it's not mistaken for a PassLok Lock)
function randomToken(){
	var token = nacl.util.encodeBase64(nacl.randomBytes(32)).slice(0,42);
	pwd.value = token;
	setTimeout(function(){
		keyStrength(pwd.value.trim(),true);
		pwd.type="TEXT";
		showKey.checked = true;
	},50)
}

//takes appropriate UI action if decryption fails
function failedDecrypt(){
	if(lockBox.value.slice(0,1) == '~' || isList || nameBeingUnlocked != ''){
		any2key();					//this displays the Key entry dialog
		keyMsg.innerHTML = "<span style='color:orange'>This Key won't unlock the item </span>" + nameBeingUnlocked;
		allowCancelWfullAccess = true;
	}else if(keyChange.style.display == 'block'){
		keyChange.style.display = 'none';
		keyMsg.innerHTML = "<span style='color:orange'>The Old Key is wrong</span>"
	}else if (checkingKey){
		shadow.style.display = 'block';
		keyScr.style.display = 'block';
		keyMsg.innerHTML = "<span style='color:orange'>Please write the last Key you used</span><br>You can change the Key in Options";
		checkingKey = false;
	}else{
		mainMsg.innerHTML = '<span>Unlock has Failed</span>';
	}
	throw('decryption failed')
}