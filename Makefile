all: style/main.css

style/main.css: style/main.scss
	sass style/main.scss > style/main.css

clean:
	rm -f style/main.css

.PHONY: clean
