test:
	@@node test/resourcer-test.js
	@@node test/events-test.js
	@@node test/validator-test.js
	@@node test/resource-view-test.js
	@@node test/cache-test.js
	@@node test/database-test.js

.PHONY: test
