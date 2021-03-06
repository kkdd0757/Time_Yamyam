import axios from 'axios';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseConfig } from '../utils/firebaseConfig.js';
import store from '../store/posting.js';
import view from '../view/form.js';

/*
 *@param {HTMLElement} dropZoneElement
 *@param {File} file
 */

const app = initializeApp(firebaseConfig);
const auth = getAuth();

const $formBody = document.querySelector('.form-body');
const $approvalTitle = document.querySelector('.approval-title');
const $submitBtn = document.querySelector('.submit');
const $errorMsg = document.querySelector('.error');
const $form = document.querySelector('form');
const $postingTitle = document.querySelector('.posting-title');
const $notice = document.querySelector('.notice');
const $cancelBtn = document.querySelector('.cancel');

// Functions --------------------------------------------
const updateThumbnails = (dropZoneElement, file) => {
  if (dropZoneElement.querySelector('.drop-zone__prompt')) {
    dropZoneElement.querySelector('.drop-zone__prompt').remove();
    dropZoneElement.querySelector('.drop-zone__img').remove();
  }

  const thumbnailElement = document.createElement('div');
  thumbnailElement.classList.add('drop-zone__thumb');
  dropZoneElement.appendChild(thumbnailElement);
  document.querySelector('.drop-zone').style.flexDirection = 'row';

  thumbnailElement.dataset.label = file.name;

  if (file.type.startsWith('image/')) {
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = () => {
      thumbnailElement.style.backgroundImage = `url('${reader.result}')`;
    };
  } else {
    thumbnailElement.style.backgroundImage = null;
  }
};

// Event bindings----------------------------
window.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async user => {
    if (user) {
      try {
        setTimeout(() => {
          $formBody.style.opacity = 1;
        }, 100);

        const { data } = await store.fetchStudyGroupData(user);
        store.setStudyGroupInfo(data);
        console.log(data);
        view.render(store.getStudyGroupData());
      } catch (error) {
        console.error(error);
      }
    } else {
      window.alert('?????????????????????')
      window.location.href = '/login.html';
      console.error('?????????????????????');
    }
  });
});

[...document.querySelectorAll('.drop-zone__input')].forEach(inputElement => {
  const dropZoneElement = inputElement.closest('.drop-zone');

  dropZoneElement.addEventListener('click', () => {
    inputElement.click();
  });

  inputElement.addEventListener('change', () => {
    [...inputElement.files].forEach(file => updateThumbnails(dropZoneElement, file));
  });

  dropZoneElement.addEventListener('dragover', e => {
    e.preventDefault();
    dropZoneElement.classList.add('drop-zone--over');
  });

  ['dragleave', 'dragend'].forEach(type => {
    dropZoneElement.addEventListener(type, () => {
      dropZoneElement.classList.remove('drop-zone--over');
    });
  });
  dropZoneElement.addEventListener('drop', e => {
    e.preventDefault();
    [...e.dataTransfer.files].forEach(file => updateThumbnails(dropZoneElement, file));
    dropZoneElement.classList.remove('drop-zone--over');
  });
});

$approvalTitle.oninput = e => {
  $submitBtn.disabled = !e.target.value.trim();
  $errorMsg.textContent = e.target.value.trim() ? '' : '????????? ??????????????????';
};

$notice.oninput = e => {
  $postingTitle.textContent = e.target.checked ? '?????? ?????? ??????????????????' : '?????? ?????? ??????????????????';
};

$form.onkeydown = e => {
  if (e.key !== 'Enter' || e.target.name === 'text-content') return;
  e.preventDefault();
};

$cancelBtn.onclick = () => {
  window.location.href = './';
};

// send data to server-----------------------------
$form.onsubmit = e => {
  e.preventDefault();
  const newPosting = {};
  const selectedId = $form.querySelector('.group-selected').dataset.id;
  newPosting.isNoti = $form.querySelector('.notice').checked;
  newPosting.title = $form.querySelector('.approval-title').value;
  newPosting.description = $form.querySelector('.text-content').value;
  newPosting.url = $form.querySelector('.url').value;
  const userUid = auth.currentUser.uid;
  axios.post(`/study/${selectedId}/posting`, { userUid, newPosting });
  // query string?????? study id ?????????
  window.location.href = `/group.html?studyId=${selectedId}`;
};
