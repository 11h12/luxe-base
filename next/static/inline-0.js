(function () {
      try {
        var comment = document.createComment("Luxe Start \n    Copyright (c) 2024 Hieu hoc code. All rights reserved.\n\n    All portions of this file are the confidential and proprietary\n    intellectual property of Hieu hoc code.\n\n    third-party licenses in LICENSES.txt");
        var body = document.body;
        if (!body) return;
        body.insertBefore(comment, body.firstChild);
        var currentScript = document.currentScript;
        if (currentScript) currentScript.remove();
      } catch (e) {
        // Ignore insert failures.
      }
    })();