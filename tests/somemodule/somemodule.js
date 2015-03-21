
describe('Application', function(){
    before(function(done){
        require('somemodule/somemodule', done);
    });

    after(require.unregister);

    it('somemodule should be correctly required', function(){
        assert.equal(somemodule, 'SOME MODULE');
    });
});