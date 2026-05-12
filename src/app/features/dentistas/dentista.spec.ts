import { TestBed } from '@angular/core/testing';

import { Dentista } from './dentista';

describe('Dentista', () => {
  let service: Dentista;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Dentista);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
