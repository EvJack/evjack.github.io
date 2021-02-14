$(document).ready(function(){

	const getFirstDigit = (x) => parseInt(x/10);
	const getLastDigit = (x) => parseInt(x%10);

	setInterval(()=>{
		var today = new Date();
		var hours = today.getHours();
		var minutes = today.getMinutes();
		var seconds = today.getSeconds();

		$(".secondsLast").css({
			'transform':'rotateY(90deg) rotate('+getLastDigit(seconds)*36+'deg)',
		});
		$(".secondsFirst").css({
			'transform':'rotateY(90deg) rotate('+getFirstDigit(seconds)*36+'deg)',
		});

		$(".minutesLast").css({
			'transform':'rotateY(90deg) rotate('+getLastDigit(minutes)*36+'deg)',
		});
		$(".minutesFirst").css({
			'transform':'rotateY(90deg) rotate('+getFirstDigit(minutes)*36+'deg)',
		});

		$(".hoursLast").css({
			'transform':'rotateY(90deg) rotate('+getLastDigit(hours)*36+'deg)',
		});
		$(".hoursFirst").css({
			'transform':'rotateY(90deg) rotate('+getFirstDigit(hours)*36+'deg)',
		});

	},1000);
});