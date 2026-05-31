pragma circom 2.0.0;

// A template that proves: "I know `secret` such that secret * secret == public_square"
template Square() {
    signal input secret;          // private: the number only I know
    signal input public_square;   // public: the claimed result (25)

    signal computed;              // an intermediate value

    computed <== secret * secret; // constraint: computed must equal secret squared
    public_square === computed;   // constraint: the public value must equal it
}

component main {public [public_square]} = Square();