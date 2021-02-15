var enterButton = document.getElementById("enter");
var input = document.getElementById("userInput");
var ul = document.querySelector("ul");
var item = document.getElementsByTagName("li");

function inputLength(){
	return input.value.length;
} 

function listLength(){
	return item.length;
}

function createListElement() {
	var li = document.createElement("li"); // Создаёться элемент класса "li"
	li.appendChild(document.createTextNode(input.value)); //Переносим текст из поля ввода в поле задачи.
	ul.appendChild(li); //добавляем "li" в "ul"
	input.value = ""; //Сброс поля ввода


	//начало создания зачеркивания
	// поскольку он находиться в функции, добавляем только к новым элементам
	function crossOut() {
		li.classList.toggle("done");
	}

	li.addEventListener("click",crossOut);
	//конец


	// кнопка удаления
	var dBtn = document.createElement("button");
	dBtn.appendChild(document.createTextNode("X"));
	li.appendChild(dBtn);
	dBtn.addEventListener("click", deleteListItem);

	function deleteListItem(){
		li.classList.add("delete")
	}
}


function addListAfterClick(){
	if (inputLength() > 0) { //Проверяем, чтобы пустое поле не создало эллемент "li"
		createListElement();
	}
}

function addListAfterKeypress(event) {
	if (inputLength() > 0 && event.which ===13) { //Проверяем нажатие кнопок "enter"/"return"
		//их виртуальный номер в системе равен 13, поэтому event.keyCode === 13
		createListElement();
	} 
}


enterButton.addEventListener("click",addListAfterClick);

input.addEventListener("keypress", addListAfterKeypress);

