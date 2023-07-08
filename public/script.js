console.log("is it get into here");
document.addEventListener("DOMContentLoaded", function () {
  function countdown() {
    let seconds = 5;
    const countdownElement = document.getElementById("countdown");

    const timer = setInterval(() => {
      if (seconds <= 0) {
        clearInterval(timer);
        countdownElement.textContent = "Wait a few more seconds";
      } else {
        countdownElement.textContent = seconds;
        seconds--;
      }
    }, 1000);
  }

  countdown();
});
