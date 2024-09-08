// test/index.test.ts
import {describe, expect, it} from 'bun:test';
import Elysia from "elysia";

const baseURL = `http://localhost:3000/`;
describe('Elysia', () => {
    it('return a response', async () => {

        let response;
        response = await fetch(`${baseURL}api/`).then(data => data.json());
        // base test to get content
        expect(response).toBeObject();
        expect(response).toHaveProperty("list");
        // body parameter
        const form = new FormData();
        form.append("schema", "test");
        response = await fetch(`${baseURL}api/`, {
            method: 'POST',
            body: form,
            headers: {
                contentType: 'application/json'
            }
        }).then(data => data.json());
        expect(response).toBeObject();
        expect(response).toHaveProperty("result");
        console.log(response);
        expect(response["result"]).toEqual("test");

    });
});
