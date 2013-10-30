#!/bin/bash

# generate JSDuck documentation
# See [https://github.com/senchalabs/jsduck]

jsduck  src/ \
        --output="doc" \
        --title="Cradle Security" \
        --footer="Copyright (c) 2012-2013 Yoovant by Marcello Gesmundo" \
        --warnings=-link,-dup_member,-nodoc