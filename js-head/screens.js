//display button labels according to item nature
function btnLabels(){
	var string = mainBox.innerHTML.trim().replace(/&[^;]+;/g,'').replace(/<a(.*?).(plk|txt)" href="data:(.*?),/,'').replace(/"(.*?)\/a>$/,'').replace(/<(.*?)>/g,'');

	if(string.match('==')) string = string.split('==')[1];				//remove tags
	var	type = string.charAt(0),
		isBase64 = !string.match(/[^a-zA-Z0-9+\/]/),
		isBase26 = !string.match(/[^A-Z]/);

	if((type.match(/[dg]/) && isBase64) || isBase26){
		decryptBtn.textContent = 'Decrypt';
		imageBtn.textContent = 'Email'
	}else{
		decryptBtn.textContent = 'Encrypt';
		imageBtn.textContent = 'Encr. to Img'
	}
	if(!string)imageBtn.textContent = 'Decrypt Img'
}

var hashiliOn = false;					//to show hashili

//this is for showing and hiding text in key box and other password input boxes
function showsec(){
	if(pwd.style.webkitTextSecurity == ""){
		if(hashiliOn){
			pwd.style.webkitTextSecurity = "none";
			showKey.src = hideImg
		}else{hashiliOn = true}	
	}else{
		pwd.style.webkitTextSecurity = "";
		showKey.src = eyeImg;
		hashiliOn = false		
	}
	keyStrength(pwd.textContent,true)
}

//for showing.hiding password fields
var eyeImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAASFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACrhKybAAAAF3RSTlMA5Qyz9kEFh3rd1sjDoGsfHRKwQIp+Qzv02bEAAACJSURBVCjPvVBJEoQgDMwCAfeFmfH/P51KkFKL0qN9SXdDVngRy8joHPK4XGyJbtvhohz+3G0ndHPxp0b1mojSqqyZsk+tqphFVN6S8cH+g3wQgwCrGtT3VjhB0BB26QGgN0aAGhDIZP/wUHLrUrk5g4RT83rcbxn3WJA90Y/zgs8nqY94d/b38AeFUhCT+3yIqgAAAABJRU5ErkJggg==",
	hideImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAAb1BMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABt6r1GAAAAJHRSTlMAFNTiDPTNBvnaulFBAe/osrGBZCXSwIdnLhzIqKd7XFRLSjAYduwyAAAAuklEQVQoz62QRxbDIAwFhWkhwb07PeH+Z4wQPMjCS89KegP6AjiWSbF9oVzBQNyNlKZZ/s+wwpvLyXlkp7P5umiIcYDIwB0ZLWzrTb3GSQYbMsjDl3wj0fj6TDmpK7F60nnLeDCW2h6rgioBVZgmwlwUJoo6bkC7KRQ9iQ/MzuWtXyjKKcTpmVc8mht4Nu5NV+Y/UAKItaY7byHsOeSkp48uQSahO+kiISfD+ha/nbcLwxwFuzB1hUP5AR4JF1hy2DV7AAAAAElFTkSuQmCC";

function chat2main(){
	chatScr.style.display = 'none'
}

//close image screen
function image2main(){
	if(imageScr.style.display=='block'){
		imageScr.style.display = 'none';
		shadow.style.display = 'none';
		Decrypt(mainBox.textContent);
		setTimeout(function(){mainMsg.textContent = 'Image box closed. Did you save the image by right-clicking?'},100)
	}
}

function resetChat(){
	var frame = document.getElementById('chatFrame');
	var src = frame.src;
	frame.src = '';
	setTimeout(function(){frame.src = src;}, 10)
}

//for clearing different boxes
function clearMain(){
	mainBox.textContent = '';
	mainMsg.textContent = 'Ready to encrypt';
	btnLabels()
}

//for selecting the Main box contents
function selectMain(){
  if(mainBox.textContent.trim() != ''){
    var range, selection;
    if (document.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(mainBox);
        range.select()
    } else if (window.getSelection) {
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(mainBox);
        selection.removeAllRanges();
        selection.addRange(range)
    }
	document.execCommand('copy');
	mainMsg.textContent = "main Box copied to clipboard"
  }
}

//reveals or hides file output options
function toggleFileOptions(){
	if(fileMode.checked){
		fileOptions.style.display = ''
	}else{
		fileOptions.style.display = 'none'
	}
}

//these close the chat
function closeChat() {
	shadow.style.display = "none";
	chatDialog.style.display = "none"
}

function cancelChat(){
	closeChat();
	mainMsg.textContent = 'Chat canceled'
}

//displays Key strength and decrypts
function pwdKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if (key == 13){lockUnlock()} else{
		 return keyStrength(pwd.innerHTML.replace(/<br>$/,"").trim(),true)
	}
}

//swaps contents of the key box and the main box
function swapBoxes(){
	var text = mainBox.innerHTML.replace(/<br>$/,"").trim().replace(/<span(.*?)>/,'').replace(/<\/span>$/,'');
	mainBox.innerHTML = pwd.innerHTML.replace(/<br>$/,"").trim();
	pwd.innerHTML = text
}

//writes five random dictionary words in the Password box
function suggestKey(){
	var output = '';
	var wordlist = wordListExp.toString().slice(1,-2).split('|')
	for(var i = 1; i <=5 ; i++){
		var rand = wordlist[Math.floor(Math.random()*wordlist.length)];
		rand = rand.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g');
		output = output + ' ' + rand
	}
	setTimeout(function() {
		keyStrength(output.replace(/<br>$/,"").trim().trim(),true);
		pwd.type="TEXT";
		showKey.checked = true;
		pwd.textContent = output.trim()
	},100);
}

function cancelCover(){
	shadow.style.display = "none";
	coverScr.style.display = "none";
	mainMsg.textContent = 'Text hide canceled'
}

//loads the chat frame
function main2chat(token){
	if(isAndroid){
		var reply = confirm('On Android, the chat function works from a browser page, but not yet from the app. Please cancel if you are running URSA as a native app.');
		if(!reply) return
	}
	document.getElementById('chatFrame').src = 'https://www.passlok.com/chat/index.html#' + token;
	chatBtn.textContent = 'Back to Chat';
	chatBtn.style.color = 'orange';
	chatScr.style.display = 'block'
}

//for opening the help screen and back
function main2help(){
	if(mainScr.style.display == 'block'){
		mainScr.style.display = 'none';
		helpScr.style.display = 'block'
	}else{
		mainScr.style.display = 'block';
		helpScr.style.display = 'none'
	}
}

//put cursor in the box. Handy when using keyboard shortcuts
function focusBox(){
	if (!isMobile){															//on mobile, don't focus
		pwd.focus()
	}
}

//closes everything else in help
function openHelp(theID){
	var helpItems = document.getElementsByClassName('helptext');
	for(var i=0; i < helpItems.length; i++){
		helpItems[i].style.display = 'none'
	}
	document.getElementById(theID).style.display = "block";
	if(isMobile){									//scroll to the item
		location.href = '#';
		location.href = '#a' + theID;
	}
}
//2nd level
function openHelp2(theID){
	var helpItems = document.getElementsByClassName('helptext2');
	for(var i=0; i < helpItems.length; i++){
		helpItems[i].style.display = 'none'
	}
	document.getElementById(theID).style.display = "block";
	if(isMobile){									//scroll to the item
		location.href = '#';
		location.href = '#a' + theID
	}
}

//for rich text editing
function formatDoc(sCmd, sValue) {
	  document.execCommand(sCmd, false, sValue); mainBox.focus();
}

var niceEditor = false;
//function to toggle rich text editing on mainBox
function toggleRichText() {
	if(niceEditor) {
		toolBar1.style.display = 'none';
		mainBox.style.borderTopLeftRadius = '15px';
		mainBox.style.borderTopRightRadius = '15px';
		niceEditBtn.textContent = 'Rich';
		niceEditor = false
	} else {
		toolBar1.style.display = 'block';
		mainBox.style.borderTopLeftRadius = '0';
		mainBox.style.borderTopRightRadius = '0';
		niceEditBtn.textContent = 'Plain';
		niceEditor = true
	}
	textheight();
}