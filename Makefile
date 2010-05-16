test:
	@@node test/resourcer-test.js
	@@node test/events-test.js
	@@node test/validator-test.js

.PHONY: test
