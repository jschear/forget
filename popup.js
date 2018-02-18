
function getCurrentTab(callback) {
  var queryInfo = { active: true, currentWindow: true };
  chrome.tabs.query(queryInfo, (tabs) => {
    callback(tabs[0]);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  var doneButton = document.getElementById('done');
  var durationSelect = document.getElementById('dropdown');

  doneButton.addEventListener('click', () => {
    var duration = durationSelect.options[durationSelect.selectedIndex].value;
    getCurrentTab((tab) => {
      chrome.extension.getBackgroundPage().addBookmark(tab, duration);
      window.close();
    });
  });
});
