test:
	@@node test/resourcer-test.js
	@@node test/events-test.js
	@@node test/validator-test.js
	@@node test/resource-view-test.js

.PHONY: test
