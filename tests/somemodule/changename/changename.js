describe('Application', function(){
    before(function(done){
        require('somemodule/changename/changename', done, {
            changename: 'othermodule'
        });
    });

    after(require.unregister);

    it('changename should be required as othermodule', function(){
        assert.equal(othermodule, 'CHANGENAME');
    });
});