// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
// chrome.storage.sync.get('keyflag', (res) => {
//     alert(res.keyflag);
// });
// chrome.storage.sync.get('switchon', (res) => {
//     alert(res.switchon);
// });
$(function() {
    chrome.storage.sync.get('keyflag', (res) => {
        if (res.keyflag) {
            $("input[id='switch2']").attr("checked", true);
        }
    });
    chrome.storage.sync.get('switchon', (res) => {
        if (res.switchon) {
            $("input[id='switch1']").attr("checked", true);
        }
    });
})

$("#switch1").click(function() {
    if (this.checked) {
        chrome.storage.sync.set({ switchon: 1 });
    } else {
        chrome.storage.sync.set({ switchon: 0 });
    }
});
$("#switch2").click(function() {
    if (this.checked) {
        chrome.storage.sync.set({ keyflag: 1 });
    } else {
        chrome.storage.sync.set({ keyflag: 0 });
    }
});