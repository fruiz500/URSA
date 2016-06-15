//this is for showing and hiding text in key box and other password input boxes
function showsec(){
	if(showKey.checked){
		pwd.style.webkitTextSecurity = "none"
	}else{
		pwd.style.webkitTextSecurity = "disc"
	}
}

function chat2main(){
	chatScr.style.display = 'none'
}

function resetChat(){
	var frame = document.getElementById('chatFrame');
	var src = frame.src;
	frame.src = '';
	setTimeout(function(){frame.src = src;}, 0);
}

//for clearing different boxes
function clearMain(){
	mainBox.innerHTML = '';
	mainMsg.innerHTML = '';
}

//for selecting the Main box contents
function selectMain(){
    var range, selection;
    if (document.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(mainBox);
        range.select();
    } else if (window.getSelection) {
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(mainBox);
        selection.removeAllRanges();
        selection.addRange(range);
    }
	document.execCommand('copy')
}

//these close the chat
function closeChat() {
	shadow.style.display = "none";
	chatDialog.style.display = "none";
}

function cancelChat(){
	closeChat();
	mainMsg.innerHTML = 'Chat canceled';
}

//displays Key strength and decrypts
function pwdKeyup(evt){
	evt = evt || window.event
	if (evt.keyCode == 13){lockUnlock()} else{
		 return keyStrength(pwd.innerHTML.replace(/<br>$/,"").trim(),true);
	}
}

//swaps contents of the key box and the main box
function swapBoxes(){
	var text = mainBox.innerHTML.replace(/<br>$/,"").trim().replace(/<span(.*?)>/,'').replace(/<\/span>$/,'');
	text = text.replace(/&nbsp;&nbsp;<button onclick="followLink\(this\);">Save<\/button><\/a>$/,'</a>');					//take out button from loaded file
	mainBox.innerHTML = pwd.innerHTML.replace(/<br>$/,"").trim();
	pwd.innerHTML = text;
	cleanKey()
}

//writes five random dictionary words in the Password box
function suggestKey(){
	var output = '';
	var wordlist = wordListExp.toString().slice(1,-2).split('|')
	for(var i = 1; i <=5 ; i++){
		var rand = wordlist[Math.floor(Math.random()*wordlist.length)];
		rand = rand.replace(/0/g,'o').replace(/1/g,'i').replace(/2/g,'z').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/8/g,'b').replace(/9/g,'g');
		output = output + ' ' + rand;
	}
	pwd.innerHTML = output.trim();
	setTimeout(function() {
		keyStrength(pwd.innerHTML.replace(/<br>$/,"").trim().trim(),true);
		pwd.type="TEXT";
		showKey.checked = true;
	},50);
}

//enables OK button if a sufficiently long cover text is loaded
function enableCover(){
	setTimeout(function(){
		var text = coverBox.value.trim();
		if(text.length > 1400){
			acceptCoverBtn.disabled = false
		}else{
			coverMsg.innerHTML = 'The cover text must be at least 1400 characters long'
		}
	},20)
}

function cancelCover(){
	shadow.style.display = "none";
	coverScr.style.display = "none";
	mainMsg.innerHTML = 'Text hide canceled';
}

//loads the chat frame
function main2chat(token){
	if(isAndroid){
		var reply = confirm('On Android, the chat function works from a browser page, but not yet from the app. Please cancel if you are running URSA as a native app.');
		if(!reply) throw('chat canceled by user');
	}
	document.getElementById('chatFrame').src = 'https://www.passlok.com/chat/index.html#' + token;
	chatBtn.innerHTML = 'Back to Chat';
	chatBtn.style.color = 'orange';
	chatScr.style.display = 'block';
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

//simple XSS filter for use in innerHTML-editing statements. Removes stuff between angle brackets
function XSSfilter(string){
	return string.replace(/<(.*?)>/gi, "")
}

<!-- Text hide trick, by Sandeep Gangadharan 2005-->
if (document.getElementById) {
 document.writeln('<style type="text/css"><!--')
 document.writeln('.texter {display:none} @media print {.texter {display:block;}}')
 document.writeln('//--></style>') }

function openClose(theID) {
 if (document.getElementById(theID).style.display === "block") { document.getElementById(theID).style.display = "none" }
 else { document.getElementById(theID).style.display = "block" } };
// end of hide trick

//as above, but closes everything else in help
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
		niceEditBtn.innerHTML = 'Rich';
		niceEditor = false
	} else {
		toolBar1.style.display = 'block';
		mainBox.style.borderTopLeftRadius = '0';
		mainBox.style.borderTopRightRadius = '0';
		niceEditBtn.innerHTML = 'Plain';
		niceEditor = true
	}
	textheight();
}